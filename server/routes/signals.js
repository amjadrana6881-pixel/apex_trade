const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get active daily trading signal
router.get('/active', (req, res) => {
  try {
    const activeSignal = db.prepare(`
      SELECT * FROM signals 
      WHERE status = 'ACTIVE' 
      ORDER BY created_at DESC LIMIT 1
    `).get();

    return res.json({
      success: true,
      data: activeSignal || null
    });
  } catch (err) {
    console.error('Error fetching active signal:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get historical signals
router.get('/history', (req, res) => {
  try {
    const signals = db.prepare('SELECT * FROM signals ORDER BY created_at DESC LIMIT 30').all();
    return res.json({
      success: true,
      data: signals
    });
  } catch (err) {
    console.error('Error fetching signals history:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all signals
router.get('/admin/list', authenticateToken, requireAdmin, (req, res) => {
  try {
    const signals = db.prepare('SELECT * FROM signals ORDER BY created_at DESC').all();
    return res.json({
      success: true,
      data: signals
    });
  } catch (err) {
    console.error('Admin signals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Create / Publish new Daily Signal
router.post('/admin/create', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { 
      title, 
      instrument, 
      order_type, 
      min_capital, 
      execution_time_pst, 
      duration_seconds, 
      profit_percentage, 
      outcome, 
      status, 
      disclaimer 
    } = req.body;

    if (!instrument || !order_type) {
      return res.status(400).json({ success: false, message: 'Instrument and Order Type are required.' });
    }

    // Set other signals to INACTIVE if this one is ACTIVE
    if (status === 'ACTIVE') {
      db.prepare("UPDATE signals SET status = 'EXPIRED' WHERE status = 'ACTIVE'").run();
    }

    const signalId = 'sig-' + uuidv4().substring(0, 10);
    const today = new Date().toLocaleDateString('en-GB');

    db.prepare(`
      INSERT INTO signals (id, title, instrument, order_type, min_capital, execution_time_pst, duration_seconds, profit_percentage, outcome, status, disclaimer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      signalId,
      title || `${today}, Day Trading Signal`,
      instrument.toUpperCase(),
      order_type.toUpperCase(),
      Number(min_capital) || 700.00,
      execution_time_pst || '07:00 PM (PST)',
      Number(duration_seconds) || 900,
      Number(profit_percentage) || 4.25,
      outcome || 'WIN',
      status || 'ACTIVE',
      disclaimer || `Disclaimer: Forex and CFD trading involve substantial risk. Trade only with funds you can afford to lose.`
    );

    return res.json({
      success: true,
      message: 'Daily Trading Signal published successfully!',
      signalId
    });
  } catch (err) {
    console.error('Create signal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create signal.' });
  }
});

// Admin: Update Signal
router.put('/admin/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      instrument, 
      order_type, 
      min_capital, 
      execution_time_pst, 
      duration_seconds, 
      profit_percentage, 
      outcome, 
      status, 
      disclaimer 
    } = req.body;

    if (status === 'ACTIVE') {
      db.prepare("UPDATE signals SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND id != ?").run(id);
    }

    db.prepare(`
      UPDATE signals 
      SET title = ?, instrument = ?, order_type = ?, min_capital = ?, execution_time_pst = ?, 
          duration_seconds = ?, profit_percentage = ?, outcome = ?, status = ?, disclaimer = ?
      WHERE id = ?
    `).run(
      title,
      instrument.toUpperCase(),
      order_type.toUpperCase(),
      Number(min_capital),
      execution_time_pst,
      Number(duration_seconds),
      Number(profit_percentage),
      outcome,
      status,
      disclaimer,
      id
    );

    return res.json({
      success: true,
      message: 'Signal updated successfully!'
    });
  } catch (err) {
    console.error('Update signal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update signal.' });
  }
});

// Admin: Delete Signal
router.delete('/admin/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM signals WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Signal deleted.' });
  } catch (err) {
    console.error('Delete signal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete signal.' });
  }
});

module.exports = router;
