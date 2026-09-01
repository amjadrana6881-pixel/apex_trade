const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter based on environment variables.
 */
function getTransporter() {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (!emailUser || !emailPass) {
    return null;
  }

  // 1. Custom SMTP Server
  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // 2. Default to Gmail Service (Works with Gmail App Passwords)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

/**
 * Generate branded HTML email template for ApexTrade OTP
 */
function generateOtpHtml({ code, type, recipientEmail }) {
  const isRegister = type === 'REGISTER';
  const title = isRegister ? 'Verify Your ApexTrade Account' : 'Reset Your ApexTrade Password';
  const actionText = isRegister 
    ? 'Thank you for choosing ApexTrade Pro. Use the verification code below to complete your registration:'
    : 'We received a request to reset your password. Use the verification code below to set a new password:';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0b0f19; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #111827; border-radius: 20px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); border-bottom: 1px solid #1e293b;">
              <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #2563eb; width: 44px; height: 44px; border-radius: 12px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 900; font-size: 22px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                    A
                  </td>
                  <td style="padding-left: 12px; text-align: left;">
                    <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; display: inline-block;">
                      ApexTrade <span style="background-color: rgba(37, 99, 235, 0.3); color: #93c5fd; font-size: 11px; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(147, 197, 253, 0.3); font-weight: 800; vertical-align: middle;">PRO</span>
                    </span>
                    <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">Institutional Trading Portal</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                ${actionText}
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 800; color: #60a5fa; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                      Verification Security Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: 8px; text-shadow: 0 0 20px rgba(37, 99, 235, 0.5);">
                      ${code}
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                      ⏱️ Valid for <strong style="color: #f59e0b;">10 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: rgba(30, 41, 59, 0.6); border-radius: 12px; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                  🔒 <strong>Security Warning:</strong> Never share this OTP code with anyone. ApexTrade staff will never ask for your verification code or account password.
                </p>
              </div>

              <p style="margin: 20px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                If you did not request this verification code for <strong>${recipientEmail}</strong>, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px; background-color: #0b0f19; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">
                ApexTrade Inc. • Global Institutional Derivatives & Option Platform
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                This is an automated security notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send an OTP code to a user's email address.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.code - 6-digit OTP code
 * @param {string} options.type - 'REGISTER' or 'FORGOT_PASSWORD'
 * @returns {Promise<{success: boolean, emailSent: boolean, error?: string, warning?: string}>}
 */
async function sendOtpEmail({ to, code, type = 'REGISTER' }) {
  const cleanEmail = (to || '').toLowerCase().trim();
  const isRegister = type === 'REGISTER';
  const subject = isRegister 
    ? `[ApexTrade] Your Registration Verification Code: ${code}`
    : `[ApexTrade] Password Reset Verification Code: ${code}`;

  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`⚠️ [EMAIL SERVICE] SMTP credentials not set in .env. OTP for ${cleanEmail}: ${code}`);
    return {
      success: true,
      emailSent: false,
      warning: 'SMTP credentials not configured. OTP code logged to server.'
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || `"ApexTrade Security" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`;
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: subject,
      html: generateOtpHtml({ code, type, recipientEmail: cleanEmail }),
      text: `Your ApexTrade ${isRegister ? 'Registration' : 'Password Reset'} verification code is: ${code}. This code is valid for 10 minutes. Do not share it with anyone.`
    });

    console.log(`✅ [EMAIL SERVICE] Verification email successfully sent to ${cleanEmail} (MessageId: ${info.messageId})`);
    return {
      success: true,
      emailSent: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`❌ [EMAIL SERVICE] Failed to send email to ${cleanEmail}:`, error.message);
    return {
      success: true,
      emailSent: false,
      error: error.message
    };
  }
}

module.exports = {
  sendOtpEmail,
  generateOtpHtml
};
