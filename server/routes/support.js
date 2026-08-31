const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Multer storage for Chat Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Max 10MB images

// Get current user's support chat messages & mark admin messages as seen
router.get('/messages', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Mark admin messages as seen by user
    db.prepare(`
      UPDATE support_messages 
      SET is_seen = 1 
      WHERE user_id = ? AND sender_role = 'admin' AND is_seen = 0
    `).run(userId);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_support_room').emit('support:messages_seen', { userId, seenBy: 'user' });
    }

    const messages = db.prepare(`
      SELECT * FROM support_messages 
      WHERE user_id = ? 
      ORDER BY created_at ASC
    `).all(userId);

    // Filter out messages deleted for this user
    const formatted = messages.filter(m => {
      const deletedBy = JSON.parse(m.deleted_by || '[]');
      return !deletedBy.includes(userId);
    }).map(m => {
      if (m.deleted_for_everyone === 1) {
        return {
          ...m,
          message: '🚫 This message was deleted',
          image_url: '',
          isDeletedForEveryone: true
        };
      }
      return m;
    });

    return res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error('Fetch support messages error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User sends a support message with optional image
router.post('/messages/send', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || 'Trader';
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if ((!message || !message.trim()) && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Message text or image is required.' });
    }

    const msgId = 'msg-' + uuidv4().substring(0, 10);

    db.prepare(`
      INSERT INTO support_messages (id, user_id, sender_role, sender_name, message, image_url, is_seen)
      VALUES (?, ?, 'user', ?, ?, ?, 0)
    `).run(msgId, userId, userName, (message || '').trim(), imageUrl);

    const newMsg = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('support:message', newMsg);
      io.to('admin_support_room').emit('support:admin_new_message', newMsg);
    }

    return res.json({
      success: true,
      data: newMsg
    });
  } catch (err) {
    console.error('Send support message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
});

// User marks admin messages as seen
router.post('/messages/mark-seen', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare("UPDATE support_messages SET is_seen = 1 WHERE user_id = ? AND sender_role = 'admin'").run(userId);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_support_room').emit('support:messages_seen', { userId, seenBy: 'user' });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User edits their sent message
router.put('/messages/:id/edit', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const existing = db.prepare('SELECT * FROM support_messages WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found or unauthorized.' });
    }

    if (existing.deleted_for_everyone === 1) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message.' });
    }

    db.prepare(`
      UPDATE support_messages 
      SET message = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(message.trim(), id);

    const updated = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(id);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('support:message_updated', updated);
      io.to('admin_support_room').emit('support:message_updated', updated);
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Edit message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to edit message.' });
  }
});

// User deletes message (mode: 'for_me' or 'for_everyone')
router.delete('/messages/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query; // 'for_me' or 'for_everyone'
    const userId = req.user.id;

    const existing = db.prepare('SELECT * FROM support_messages WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (mode === 'for_everyone') {
      if (existing.sender_role !== 'user' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You can only delete your own messages for everyone.' });
      }

      db.prepare(`
        UPDATE support_messages 
        SET deleted_for_everyone = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('support:message_deleted_for_everyone', { id });
        io.to('admin_support_room').emit('support:message_deleted_for_everyone', { id });
      }

      return res.json({ success: true, message: 'Message deleted for everyone.' });
    } else {
      const deletedBy = JSON.parse(existing.deleted_by || '[]');
      if (!deletedBy.includes(userId)) {
        deletedBy.push(userId);
      }

      db.prepare('UPDATE support_messages SET deleted_by = ? WHERE id = ?').run(JSON.stringify(deletedBy), id);

      return res.json({ success: true, message: 'Message deleted for you.' });
    }
  } catch (err) {
    console.error('Delete message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

// ================= ADMIN SUPPORT ROUTES =================

// Admin: Get all conversations
router.get('/admin/conversations', authenticateToken, requireAdmin, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT 
        u.id as user_id, 
        u.name, 
        u.email, 
        u.wallet_balance,
        (SELECT message FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT image_url FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_image,
        (SELECT created_at FROM support_messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_activity,
        (SELECT COUNT(*) FROM support_messages WHERE user_id = u.id AND sender_role = 'user' AND is_seen = 0) as unread_count
      FROM users u
      WHERE EXISTS (SELECT 1 FROM support_messages WHERE user_id = u.id)
      ORDER BY last_activity DESC
    `).all();

    return res.json({
      success: true,
      data: conversations
    });
  } catch (err) {
    console.error('Admin conversations error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get messages for specific user & mark user messages as seen by admin
router.get('/admin/conversation/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { userId } = req.params;

    // Mark user messages as seen by admin
    db.prepare(`
      UPDATE support_messages 
      SET is_seen = 1 
      WHERE user_id = ? AND sender_role = 'user' AND is_seen = 0
    `).run(userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('support:messages_seen', { userId, seenBy: 'admin' });
    }

    const messages = db.prepare(`
      SELECT * FROM support_messages 
      WHERE user_id = ? 
      ORDER BY created_at ASC
    `).all(userId);

    const formatted = messages.map(m => {
      if (m.deleted_for_everyone === 1) {
        return {
          ...m,
          message: '🚫 This message was deleted',
          image_url: '',
          isDeletedForEveryone: true
        };
      }
      return m;
    });

    return res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    console.error('Admin user messages error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Send reply to user with optional image
router.post('/admin/send', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { userId, message } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    if (!userId || ((!message || !message.trim()) && !imageUrl)) {
      return res.status(400).json({ success: false, message: 'User ID and message/image are required.' });
    }

    const msgId = 'msg-' + uuidv4().substring(0, 10);

    db.prepare(`
      INSERT INTO support_messages (id, user_id, sender_role, sender_name, message, image_url, is_seen)
      VALUES (?, ?, 'admin', 'ApexTrade Official Support', ?, ?, 0)
    `).run(msgId, userId, (message || '').trim(), imageUrl);

    const newMsg = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(msgId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('support:message', newMsg);
      io.to('admin_support_room').emit('support:admin_new_message', newMsg);
    }

    return res.json({
      success: true,
      data: newMsg
    });
  } catch (err) {
    console.error('Admin send message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send admin message.' });
  }
});

// Admin: Edit message
router.put('/admin/edit/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    db.prepare(`
      UPDATE support_messages 
      SET message = ?, is_edited = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(message.trim(), id);

    const updated = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(id);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updated.user_id}`).emit('support:message_updated', updated);
      io.to('admin_support_room').emit('support:message_updated', updated);
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Admin edit message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to edit message.' });
  }
});

// Admin: Delete message (for everyone or for me)
router.delete('/admin/delete/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.query; // 'for_everyone' or 'for_me'

    const existing = db.prepare('SELECT * FROM support_messages WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (mode === 'for_everyone') {
      db.prepare(`
        UPDATE support_messages 
        SET deleted_for_everyone = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(id);

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${existing.user_id}`).emit('support:message_deleted_for_everyone', { id });
        io.to('admin_support_room').emit('support:message_deleted_for_everyone', { id });
      }

      return res.json({ success: true, message: 'Message deleted for everyone.' });
    } else {
      const deletedBy = JSON.parse(existing.deleted_by || '[]');
      if (!deletedBy.includes(req.user.id)) {
        deletedBy.push(req.user.id);
      }
      db.prepare('UPDATE support_messages SET deleted_by = ? WHERE id = ?').run(JSON.stringify(deletedBy), id);
      return res.json({ success: true, message: 'Message deleted for admin.' });
    }
  } catch (err) {
    console.error('Admin delete message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

module.exports = router;
