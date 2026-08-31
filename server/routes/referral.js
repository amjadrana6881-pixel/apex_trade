const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get user referral statistics & tree
router.get('/tree', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT referral_code, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Tier 1 (Direct referrals)
    const level1 = db.prepare(`
      SELECT id, name, email, referral_code, wallet_balance, created_at, status 
      FROM users WHERE referred_by = ?
    `).all(user.referral_code);

    // Tier 2 (Referrals of Level 1)
    let level2 = [];
    if (level1.length > 0) {
      const l1Codes = level1.map(u => u.referral_code);
      const placeholders = l1Codes.map(() => '?').join(',');
      level2 = db.prepare(`
        SELECT id, name, email, referral_code, referred_by, wallet_balance, created_at, status 
        FROM users WHERE referred_by IN (${placeholders})
      `).all(...l1Codes);
    }

    // Tier 3 (Referrals of Level 2)
    let level3 = [];
    if (level2.length > 0) {
      const l2Codes = level2.map(u => u.referral_code);
      const placeholders = l2Codes.map(() => '?').join(',');
      level3 = db.prepare(`
        SELECT id, name, email, referral_code, referred_by, wallet_balance, created_at, status 
        FROM users WHERE referred_by IN (${placeholders})
      `).all(...l2Codes);
    }

    // Total referral earnings
    const earnings = db.prepare(`
      SELECT SUM(amount) as total 
      FROM transactions 
      WHERE user_id = ? AND type = 'REFERRAL_BONUS'
    `).get(req.user.id);

    const totalEarned = earnings && earnings.total ? earnings.total : 0.00;

    return res.json({
      success: true,
      data: {
        referralCode: user.referral_code,
        directCount: level1.length,
        totalTeamCount: level1.length + level2.length + level3.length,
        totalCommissions: totalEarned,
        tree: {
          level1: level1.map(u => ({ ...u, email: maskEmail(u.email) })),
          level2: level2.map(u => ({ ...u, email: maskEmail(u.email) })),
          level3: level3.map(u => ({ ...u, email: maskEmail(u.email) }))
        }
      }
    });
  } catch (err) {
    console.error('Referral tree error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
}

module.exports = router;
