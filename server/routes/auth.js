const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail } = require('../services/emailService');

const os = require('os');
const fs = require('fs');
const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const uploadDir = isServerless ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '../uploads');
try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

// Multer storage for KYC docs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `kyc-${Date.now()}-${uuidv4().substring(0, 8)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 1. Send OTP for Registration
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = 'otp-' + uuidv4().substring(0, 8);

    // Delete any previous active OTP for this email
    db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(cleanEmail, 'REGISTER');

    // Save with 10-minute expiry
    db.prepare(`
      INSERT INTO otp_codes (id, email, code, type, expires_at)
      VALUES (?, ?, ?, 'REGISTER', datetime('now', '+10 minutes'))
    `).run(otpId, cleanEmail, otpCode);

    console.log(`📩 [OTP DISPATCH] Registration OTP for ${cleanEmail}: ${otpCode}`);

    // Dispatch real email via Nodemailer
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: otpCode,
      type: 'REGISTER'
    });

    const isEmailSent = emailResult && emailResult.emailSent;
    const msg = isEmailSent 
      ? `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
      : `A 6-digit verification code has been generated for ${cleanEmail}.`;

    return res.json({
      success: true,
      message: msg,
      emailSent: isEmailSent,
      otp: otpCode // Provided for instant seamless UI verification & testing
    });
  } catch (err) {
    console.error('Send register OTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate verification OTP.' });
  }
});

// 2. Verify OTP & Complete Registration
router.post('/verify-and-register', (req, res) => {
  try {
    const { name, email, password, otp, referralCode } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and 6-digit OTP are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Verify OTP
    const validOtp = db.prepare(`
      SELECT * FROM otp_codes 
      WHERE email = ? AND code = ? AND type = 'REGISTER' AND datetime('now') <= datetime(expires_at)
    `).get(cleanEmail, otp.toString().trim());

    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP verification code. Please request a new one.' });
    }

    let referredBy = '';
    if (referralCode) {
      const referrer = db.prepare('SELECT referral_code FROM users WHERE referral_code = ?').get(referralCode.trim());
      if (referrer) {
        referredBy = referrer.referral_code;
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userId = 'usr-' + uuidv4().substring(0, 12);
    const userRefCode = 'APEX' + Math.floor(100000 + Math.random() * 900000);

    db.prepare(`
      INSERT INTO users (id, name, email, password, role, wallet_balance, tradeable_amount, referral_code, referred_by)
      VALUES (?, ?, ?, ?, 'user', 0.00, 0.00, ?, ?)
    `).run(userId, name.trim(), cleanEmail, hashedPassword, userRefCode, referredBy);

    // Delete used OTP
    db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(cleanEmail, 'REGISTER');

    const token = jwt.sign({ id: userId, email: cleanEmail, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    const newUser = db.prepare('SELECT id, name, email, role, wallet_balance, tradeable_amount, investment_balance, referral_code, kyc_status FROM users WHERE id = ?').get(userId);

    return res.json({
      success: true,
      message: 'Account verified and registered successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Verify & register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Standard Register (Direct)
router.post('/register', (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    let referredBy = '';
    if (referralCode) {
      const referrer = db.prepare('SELECT referral_code FROM users WHERE referral_code = ?').get(referralCode.trim());
      if (referrer) {
        referredBy = referrer.referral_code;
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userId = 'usr-' + uuidv4().substring(0, 12);
    const userRefCode = 'APEX' + Math.floor(100000 + Math.random() * 900000);

    db.prepare(`
      INSERT INTO users (id, name, email, password, role, wallet_balance, tradeable_amount, referral_code, referred_by)
      VALUES (?, ?, ?, ?, 'user', 0.00, 0.00, ?, ?)
    `).run(userId, name.trim(), cleanEmail, hashedPassword, userRefCode, referredBy);

    const token = jwt.sign({ id: userId, email: cleanEmail, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    const newUser = db.prepare('SELECT id, name, email, role, wallet_balance, tradeable_amount, investment_balance, referral_code, kyc_status FROM users WHERE id = ?').get(userId);

    return res.json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// 3. Send Forgot Password OTP
router.post('/send-forgot-password-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered trader account found with this email.' });
    }

    // Generate 6-digit Reset OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = 'otp-' + uuidv4().substring(0, 8);

    db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(cleanEmail, 'FORGOT_PASSWORD');

    db.prepare(`
      INSERT INTO otp_codes (id, email, code, type, expires_at)
      VALUES (?, ?, ?, 'FORGOT_PASSWORD', datetime('now', '+10 minutes'))
    `).run(otpId, cleanEmail, otpCode);

    console.log(`🔑 [PASSWORD RESET OTP] OTP for ${cleanEmail}: ${otpCode}`);

    // Dispatch real email via Nodemailer
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: otpCode,
      type: 'FORGOT_PASSWORD'
    });

    const isEmailSent = emailResult && emailResult.emailSent;
    const msg = isEmailSent 
      ? `Password reset code sent to ${cleanEmail}. Please check your inbox and spam folder.`
      : `Password reset verification code generated for ${cleanEmail}.`;

    return res.json({
      success: true,
      message: msg,
      emailSent: isEmailSent,
      otp: otpCode
    });
  } catch (err) {
    console.error('Send forgot password OTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate password reset code.' });
  }
});

// 4. Reset Password with OTP
router.post('/reset-password-with-otp', (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, 6-digit OTP code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP
    const validOtp = db.prepare(`
      SELECT * FROM otp_codes 
      WHERE email = ? AND code = ? AND type = 'FORGOT_PASSWORD' AND datetime('now') <= datetime(expires_at)
    `).get(cleanEmail, otp.toString().trim());

    if (!validOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code. Please request a new code.' });
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, cleanEmail);
    db.prepare('DELETE FROM otp_codes WHERE email = ? AND type = ?').run(cleanEmail, 'FORGOT_PASSWORD');

    return res.json({
      success: true,
      message: 'Your account password has been reset successfully! You can now log in.'
    });
  } catch (err) {
    console.error('Reset password with OTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = (email || '').toLowerCase().trim();
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@apextrade.net').toLowerCase().trim();
    const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // Direct Master Admin Authentication from .env
    if (cleanEmail === envAdminEmail && password === envAdminPass) {
      let adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
      if (!adminUser) {
        adminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
      }
      const adminId = adminUser?.id || 'admin-root-001';
      const token = jwt.sign({ id: adminId, email: envAdminEmail, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        success: true,
        message: 'Master Admin authenticated successfully!',
        token,
        user: {
          id: adminId,
          name: adminUser?.name || 'ApexTrade Master Admin',
          email: envAdminEmail,
          role: 'admin',
          wallet_balance: adminUser?.wallet_balance || 50000.00,
          tradeable_amount: adminUser?.tradeable_amount || 50000.00,
          investment_balance: 0,
          referral_code: 'APEXADMIN',
          phone: '',
          kyc_status: 'VERIFIED',
          created_at: new Date().toISOString()
        }
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Please contact customer support.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      tradeable_amount: user.tradeable_amount,
      investment_balance: user.investment_balance,
      referral_code: user.referral_code,
      phone: user.phone,
      kyc_status: user.kyc_status,
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, wallet_balance, tradeable_amount, investment_balance, 
             referral_code, referred_by, phone, kyc_status, status, created_at,
             withdrawal_password, saved_usdt_address, saved_usdt_network
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasWithdrawalPassword = Boolean(user.withdrawal_password && user.withdrawal_password.trim().length > 0);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wallet_balance: user.wallet_balance,
        tradeable_amount: user.tradeable_amount,
        investment_balance: user.investment_balance,
        referral_code: user.referral_code,
        referred_by: user.referred_by,
        phone: user.phone,
        kyc_status: user.kyc_status,
        status: user.status,
        created_at: user.created_at,
        has_withdrawal_password: hasWithdrawalPassword,
        saved_usdt_address: user.saved_usdt_address || '',
        saved_usdt_network: user.saved_usdt_network || 'TRC-20'
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

// Set / Update Dedicated Withdrawal Password (PIN)
router.post('/set-withdrawal-password', authenticateToken, (req, res) => {
  try {
    const { withdrawalPassword, currentLoginPassword } = req.body;

    if (!withdrawalPassword || withdrawalPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Withdrawal password must be at least 4 characters/digits.' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If currentLoginPassword is provided, verify login password
    if (currentLoginPassword) {
      const isMatch = bcrypt.compareSync(currentLoginPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current login password is incorrect.' });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(withdrawalPassword, salt);

    db.prepare('UPDATE users SET withdrawal_password = ? WHERE id = ?').run(hashed, req.user.id);

    return res.json({
      success: true,
      message: 'Withdrawal Security Password has been set successfully!'
    });
  } catch (err) {
    console.error('Set withdrawal password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to set withdrawal password.' });
  }
});

// Save Default USDT Withdrawal Address
router.post('/save-usdt-address', authenticateToken, (req, res) => {
  try {
    const { address, network } = req.body;

    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid USDT wallet address.' });
    }

    const validNetwork = (network && ['TRC-20', 'BEP-20', 'ERC-20'].includes(network)) ? network : 'TRC-20';

    db.prepare('UPDATE users SET saved_usdt_address = ?, saved_usdt_network = ? WHERE id = ?')
      .run(address.trim(), validNetwork, req.user.id);

    return res.json({
      success: true,
      message: 'Default USDT withdrawal address saved successfully!',
      savedAddress: address.trim(),
      savedNetwork: validNetwork
    });
  } catch (err) {
    console.error('Save USDT address error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save withdrawal address.' });
  }
});

// Update Profile Info
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone } = req.body;
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
      name || req.user.name,
      phone || req.user.phone || '',
      req.user.id
    );

    const updated = db.prepare('SELECT id, name, email, role, wallet_balance, tradeable_amount, investment_balance, referral_code, phone, kyc_status FROM users WHERE id = ?').get(req.user.id);

    return res.json({ success: true, message: 'Profile updated successfully!', user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }

    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

    return res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// Upload KYC
router.post('/kyc', authenticateToken, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid identity document.' });
    }

    const docPath = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE users SET kyc_status = 'PENDING', kyc_doc = ? WHERE id = ?").run(docPath, req.user.id);

    return res.json({
      success: true,
      message: 'KYC documents submitted successfully! Admin will review shortly.',
      kyc_status: 'PENDING'
    });
  } catch (err) {
    console.error('KYC upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload KYC document.' });
  }
});

module.exports = router;
