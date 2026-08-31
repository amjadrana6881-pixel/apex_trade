const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get all active packages
router.get('/packages', (req, res) => {
  try {
    const packages = db.prepare('SELECT * FROM investment_packages WHERE is_active = 1').all();
    return res.json({
      success: true,
      data: packages
    });
  } catch (err) {
    console.error('Error fetching packages:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Invest into a package
router.post('/invest', authenticateToken, (req, res) => {
  try {
    const { packageId, amount } = req.body;
    const investAmount = Number(amount);

    if (!packageId || isNaN(investAmount) || investAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid investment parameters.' });
    }

    const pkg = db.prepare('SELECT * FROM investment_packages WHERE id = ? AND is_active = 1').get(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found or inactive.' });
    }

    if (investAmount < pkg.min_amount || investAmount > pkg.max_amount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between $${pkg.min_amount.toLocaleString()} and $${pkg.max_amount.toLocaleString()} for ${pkg.name}.`
      });
    }

    const user = db.prepare('SELECT wallet_balance, investment_balance FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.wallet_balance < investAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance to invest this amount.' });
    }

    const dailyProfit = (investAmount * pkg.daily_roi) / 100;
    const newWalletBalance = user.wallet_balance - investAmount;
    const newInvestmentBalance = (user.investment_balance || 0) + investAmount;

    // Update user balances
    db.prepare(`
      UPDATE users 
      SET wallet_balance = ?, tradeable_amount = ?, investment_balance = ? 
      WHERE id = ?
    `).run(newWalletBalance, newWalletBalance, newInvestmentBalance, req.user.id);

    const investmentId = 'inv-' + uuidv4().substring(0, 10);

    db.prepare(`
      INSERT INTO user_investments (id, user_id, package_id, package_name, amount, daily_roi, daily_profit, duration_days, days_passed, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE')
    `).run(
      investmentId,
      req.user.id,
      pkg.id,
      pkg.name,
      investAmount,
      pkg.daily_roi,
      dailyProfit,
      pkg.duration_days
    );

    // Record transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
      VALUES (?, ?, 'INVESTMENT', ?, ?, ?)
    `).run(
      'tx-' + uuidv4().substring(0, 10),
      req.user.id,
      -investAmount,
      `Invested in ${pkg.name} ($${investAmount.toFixed(2)}) - ${pkg.daily_roi}% Daily for ${pkg.duration_days} Days`,
      investmentId
    );

    return res.json({
      success: true,
      message: `Successfully invested $${investAmount.toFixed(2)} in ${pkg.name}! Daily profit: $${dailyProfit.toFixed(2)}.`,
      investmentId
    });
  } catch (err) {
    console.error('Investment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process investment.' });
  }
});

// Get user's active & completed investments
router.get('/my', authenticateToken, (req, res) => {
  try {
    const investments = db.prepare(`
      SELECT * FROM user_investments 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    const totalInvested = investments.reduce((acc, curr) => curr.status === 'ACTIVE' ? acc + curr.amount : acc, 0);
    const totalProfitEarned = investments.reduce((acc, curr) => acc + curr.total_profit_earned, 0);
    const totalDailyRoi = investments.reduce((acc, curr) => curr.status === 'ACTIVE' ? acc + curr.daily_profit : acc, 0);

    return res.json({
      success: true,
      data: {
        investments,
        summary: {
          totalInvested,
          totalProfitEarned,
          totalDailyRoi,
          activeCount: investments.filter(i => i.status === 'ACTIVE').length
        }
      }
    });
  } catch (err) {
    console.error('Error fetching my investments:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
