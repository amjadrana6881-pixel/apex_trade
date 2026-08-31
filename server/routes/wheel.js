const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get wheel status and prizes
router.get('/status', authenticateToken, (req, res) => {
  try {
    const spinSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'spin_enabled'").get();
    const isActive = spinSetting ? spinSetting.value === 'true' : true;

    const prizes = db.prepare('SELECT * FROM wheel_prizes WHERE is_active = 1 ORDER BY position ASC').all();

    // Check if user has already spun in the last 24 hours
    const lastSpin = db.prepare(`
      SELECT created_at FROM user_spins 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id);

    let hasSpun = false;
    if (lastSpin) {
      const lastSpinTime = new Date(lastSpin.created_at).getTime();
      const now = Date.now();
      const hoursSince = (now - lastSpinTime) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        hasSpun = true;
      }
    }

    return res.json({
      success: true,
      data: {
        active: isActive,
        allowed: isActive && !hasSpun,
        hasSpun,
        wheel: {
          id: 'wheel-main',
          prizes: prizes.map(p => ({
            id: p.id,
            label: p.label,
            type: p.type,
            amount: p.amount,
            position: p.position,
            color: p.color
          }))
        }
      }
    });
  } catch (err) {
    console.error('Wheel status error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Perform Spin
router.post('/spin', authenticateToken, (req, res) => {
  try {
    const spinSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'spin_enabled'").get();
    if (spinSetting && spinSetting.value !== 'true') {
      return res.status(400).json({ success: false, error: 'Spin to Win is currently disabled.' });
    }

    // Check last spin
    const lastSpin = db.prepare(`
      SELECT created_at FROM user_spins 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id);

    if (lastSpin) {
      const lastSpinTime = new Date(lastSpin.created_at).getTime();
      const hoursSince = (Date.now() - lastSpinTime) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return res.status(400).json({ success: false, error: 'You have already spun today. Try again in 24 hours!' });
      }
    }

    const prizes = db.prepare('SELECT * FROM wheel_prizes WHERE is_active = 1 ORDER BY position ASC').all();
    if (!prizes || prizes.length === 0) {
      return res.status(400).json({ success: false, error: 'No wheel prizes configured.' });
    }

    // Weighted random selection
    const totalWeight = prizes.reduce((acc, p) => acc + (p.probability_weight || 1), 0);
    let randomNum = Math.random() * totalWeight;
    let selectedPrize = prizes[0];

    for (const prize of prizes) {
      if (randomNum < (prize.probability_weight || 1)) {
        selectedPrize = prize;
        break;
      }
      randomNum -= (prize.probability_weight || 1);
    }

    // Record user spin
    db.prepare(`
      INSERT INTO user_spins (id, user_id, prize_id, prize_label, amount)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'spn-' + uuidv4().substring(0, 10),
      req.user.id,
      selectedPrize.id,
      selectedPrize.label,
      selectedPrize.amount
    );

    // Credit prize amount to user's wallet
    if (selectedPrize.amount > 0) {
      const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(req.user.id);
      const newBal = (user.wallet_balance || 0) + selectedPrize.amount;
      db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(newBal, newBal, req.user.id);

      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount, description, reference_id)
        VALUES (?, ?, 'SPIN_REWARD', ?, ?, ?)
      `).run(
        'tx-' + uuidv4().substring(0, 10),
        req.user.id,
        selectedPrize.amount,
        `Won ${selectedPrize.label} ($${selectedPrize.amount}) from Lucky Spin Wheel`,
        selectedPrize.id
      );
    }

    return res.json({
      success: true,
      message: `Congratulations! You won ${selectedPrize.label}!`,
      data: {
        winningPosition: selectedPrize.position,
        prize: {
          label: selectedPrize.label,
          type: selectedPrize.type,
          amount: selectedPrize.amount,
          position: selectedPrize.position
        }
      }
    });
  } catch (err) {
    console.error('Spin error:', err);
    return res.status(500).json({ success: false, error: 'Internal error executing spin.' });
  }
});

module.exports = router;
