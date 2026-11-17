const nodemailer = require('nodemailer');

/**
 * Checks whether valid SMTP credentials are configured in .env
 */
function isSmtpConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(
    user &&
    pass &&
    user !== 'your_email@gmail.com' &&
    pass !== 'your_email_app_password' &&
    !user.includes('your_email') &&
    !pass.includes('your_email_app_password')
  );
}

/**
 * Sends an email using Nodemailer or simulates delivery if SMTP is not configured
 * @param {{ email: string, subject: string, message?: string, html?: string }} options
 * @returns {Promise<{ sent: boolean, reason?: string, messageId?: string }>}
 */
const sendEmail = async (options) => {
  if (!isSmtpConfigured()) {
    console.warn(
      `⚠️ [EMAIL SIMULATION] Real email not sent to "${options.email}" because SMTP is not configured in server/.env.` +
      ` (EMAIL_USER is set to placeholder "${process.env.EMAIL_USER}").`
    );
    return {
      sent: false,
      reason: 'SMTP credentials not configured in server/.env',
    };
  }

  const port = Number(process.env.EMAIL_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.EMAIL_FROM || 'E.G.S Learning Platform'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ [EMAIL SENT] Delivered email to "${options.email}" (MessageId: ${info.messageId})`);
  return { sent: true, messageId: info.messageId };
};

module.exports = sendEmail;
