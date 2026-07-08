const { emailConfig, isSmtpConfigured, smtpTransporter } = require('../config/email');

/**
 * Basic HTML container for PashuSetu emails
 */
const baseEmailTemplate = ({ title, preview, body, note }) => {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; background: #f4f7fb; color: #172033; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .wrap { width: 100%; padding: 28px 12px; box-sizing: border-box; }
      .container { max-width: 600px; margin: 0 auto; }
      .brand { padding: 20px 4px; text-align: center; }
      .logo { display: inline-block; font-weight: 800; font-size: 24px; color: #10b981; text-decoration: none; }
      .card { background: #fff; border: 1px solid #e8eef7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(22,34,51,0.05); }
      .hero { padding: 32px 32px 16px; text-align: center; }
      h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
      .lead { margin: 12px 0 0; color: #64748b; font-size: 16px; line-height: 1.5; }
      .content { padding: 0 32px 32px; }
      .otp-code { margin: 24px 0; padding: 16px; border-radius: 12px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; color: #0f172a; font-size: 32px; font-weight: 800; letter-spacing: 0.25em; }
      .note { color: #94a3b8; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 24px; }
      .footer { padding: 20px 12px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="container">
        <div class="brand">
          <a class="logo" href="${emailConfig.clientUrl}">${emailConfig.appName}</a>
        </div>
        <div class="card">
          <div class="hero">
            <h1>${title}</h1>
            ${preview ? `<p class="lead">${preview}</p>` : ''}
          </div>
          <div class="content">
            ${body}
            ${note ? `<p class="note">${note}</p>` : ''}
          </div>
        </div>
        <div class="footer">
          You received this email because you are using ${emailConfig.appName}.<br />
          Need assistance? Contact us at ${emailConfig.supportEmail || 'support@pashusetu.com'}.
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};

/**
 * Send OTP verification email
 * @param {Object} options - { to, name, otp, expiresIn }
 */
const sendOtpEmail = async ({ to, name, otp, expiresIn = '5 minutes' }) => {
  const subject = `[${emailConfig.appName}] Your Login/Signup Verification Code`;
  const preview = `Use verification code ${otp} to log in to your ${emailConfig.appName} account.`;
  const greeting = name ? `Hi ${name},` : 'Hello,';
  
  const html = baseEmailTemplate({
    title: `Welcome to ${emailConfig.appName}`,
    preview,
    body: `
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">
        Your verification code is:
      </p>
      <div class="otp-code">${otp}</div>
    `,
    note: `This OTP is valid for ${expiresIn}.`
  });

  const text = `Welcome to ${emailConfig.appName}\n\nYour verification code is ${otp}\n\nThis OTP is valid for ${expiresIn}.`;

  if (isSmtpConfigured) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[EMAIL] OTP successfully sent via SMTP to: ${to}`);
      console.log(`Message ID: ${info.messageId}`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send email via SMTP: ${error.message}`);
      throw error;
    }
  } else {
    // Fallback to console logging (helpful for development environments without configured credentials)
    console.log(`
==================================================
[EMAIL FALLBACK]
To: ${to}
Subject: ${subject}
Body: OTP is [ ${otp} ] (Expires in ${expiresIn})
==================================================
    `);
    
    return { sent: true, provider: 'fallback', otp };
  } // Return OTP for testing/verification purpose if needed
};

module.exports = {
  sendOtpEmail
};
