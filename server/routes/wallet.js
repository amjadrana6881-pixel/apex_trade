const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const os = require('os');
const fs = require('fs');
const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const uploadDir = isServerless ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '../uploads');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

// Receipt upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get configured crypto deposit addresses
router.get(['/addresses', '/deposit-wallets'], (req, res) => {
  try {
    const wallets = db.prepare('SELECT * FROM deposit_wallets WHERE is_active = 1').all();
    return res.json({
      success: true,
      data: wallets
    });
  } catch (err) {
    console.error('Error fetching deposit addresses:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit Crypto Deposit Request
router.post('/deposit', authenticateToken, upload.single('receipt'), (req, res) => {
  try {
    const { amount, network, txid } = req.body;
    const depositAmount = Number(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid deposit amount.' });
    }

    const minDepositSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'min_deposit'").get();
    const minDeposit = minDepositSetting ? Number(minDepositSetting.value) : 10;

    if (depositAmount < minDeposit) {
      return res.status(400).json({ success: false, message: `Minimum crypto deposit amount is $${minDeposit.toFixed(2)}.` });
    }

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const depositId = 'dep-' + uuidv4().substring(0, 10);

    db.prepare(`
      INSERT INTO deposits (id, user_id, amount, network, txid, receipt_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      depositId,
      req.user.id,
      depositAmount,
      network || 'TRC-20',
      txid || '',
      receiptUrl
    );

    // Add transaction entry
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, reference_id, status)
      VALUES (?, ?, 'DEPOSIT', ?, ?, ?, 'PENDING')
    `).run(
      'tx-' + uuidv4().substring(0, 10),
      req.user.id,
      depositAmount,
      `Crypto deposit request via ${network || 'TRC-20'} ($${depositAmount.toFixed(2)})`,
      depositId
    );

    return res.json({
      success: true,
      message: 'Crypto deposit request submitted successfully! Your funds will be credited once verified on blockchain by admin.',
      depositId
    });
  } catch (err) {
    console.error('Deposit request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process deposit request.' });
  }
});

// Submit Crypto Withdrawal Request
router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount, network, destinationAddress, withdrawalPassword, saveAsDefault } = req.body;
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid withdrawal amount.' });
    }

    if (!destinationAddress || !destinationAddress.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your USDT receiving address.' });
    }

    // Enforce USDT Only
    const validUsdtNetworks = ['TRC-20', 'BEP-20', 'ERC-20'];
    const chosenNetwork = validUsdtNetworks.includes(network) ? network : 'TRC-20';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify Withdrawal Security Password
    if (!user.withdrawal_password || user.withdrawal_password.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        requiresWithdrawalPasswordSetup: true,
        message: 'You have not set a Withdrawal Security Password yet. Please set your Withdrawal Password first.' 
      });
    }

    if (!withdrawalPassword) {
      return res.status(400).json({ success: false, message: 'Withdrawal Security Password is required to execute withdrawals.' });
    }

    const isMatch = bcrypt.compareSync(withdrawalPassword, user.withdrawal_password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect Withdrawal Security Password. Please try again.' });
    }

    const minWithdrawSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'min_withdrawal'").get();
    const minWithdraw = minWithdrawSetting ? Number(minWithdrawSetting.value) : 10;

    if (withdrawAmount < minWithdraw) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal amount is $${minWithdraw.toFixed(2)}.` });
    }

    if (user.wallet_balance < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance for this withdrawal.' });
    }

    const feeSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'withdrawal_fee_percent'").get();
    const feePct = feeSetting ? Number(feeSetting.value) : 10.0;
    const fee = (withdrawAmount * feePct) / 100;
    const netAmount = withdrawAmount - fee;

    // Deduct balance immediately
    const updatedBalance = user.wallet_balance - withdrawAmount;
    db.prepare('UPDATE users SET wallet_balance = ?, tradeable_amount = ? WHERE id = ?').run(updatedBalance, updatedBalance, req.user.id);

    // Save default address if requested
    if (saveAsDefault) {
      db.prepare('UPDATE users SET saved_usdt_address = ?, saved_usdt_network = ? WHERE id = ?')
        .run(destinationAddress.trim(), chosenNetwork, req.user.id);
    }

    const withdrawalId = 'wth-' + uuidv4().substring(0, 10);

    db.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, fee, net_amount, network, destination_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(
      withdrawalId,
      req.user.id,
      withdrawAmount,
      fee,
      netAmount,
      chosenNetwork,
      destinationAddress.trim()
    );

    // Record transaction
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, description, reference_id, status)
      VALUES (?, ?, 'WITHDRAWAL', ?, ?, ?, 'PENDING')
    `).run(
      'tx-' + uuidv4().substring(0, 10),
      req.user.id,
      -withdrawAmount,
      `Crypto withdrawal to ${destinationAddress.trim()} (Net: $${netAmount.toFixed(2)})`,
      withdrawalId
    );

    return res.json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toFixed(2)} submitted successfully! Processed within standard blockchain clearance.`,
      withdrawalId
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process withdrawal request.' });
  }
});

// Get User's Transactions
router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all(req.user.id);

    const deposits = db.prepare('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);

    return res.json({
      success: true,
      data: {
        transactions,
        deposits,
        withdrawals
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
