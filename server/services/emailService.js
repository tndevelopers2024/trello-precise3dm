import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// In-memory record of sent emails for testing / debugging / verification
const sentEmailsLog = [];

export const getSentEmails = () => [...sentEmailsLog];
export const clearSentEmails = () => {
  sentEmailsLog.length = 0;
};

/**
 * Create Nodemailer transporter based on environment config
 */
const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });
  }

  // Fallback: Test stream transporter (JSON / Memory logging)
  return nodemailer.createTransport({
    jsonTransport: true,
  });
};

const getFromAddress = () => {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Precise3DM Workspace" <noreply@precise3dm.com>';
};

const getClientUrl = () => {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  return raw.split(",")[0].trim().replace(/\/$/, "");
};

/**
 * Send an account invitation email with a secure one-time activation link
 */
export const sendInvitationEmail = async ({ to, name, token, inviterName, role }) => {
  const clientUrl = getClientUrl();
  const activationUrl = `${clientUrl}/activate?token=${encodeURIComponent(token)}`;
  const roleLabel = role === "admin" ? "Project Manager (Admin)" : "Team Member";
  const inviterText = inviterName ? ` by <strong>${inviterName}</strong>` : "";

  const subject = "Invitation to join Precise3DM Workspace";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 3px solid #ea580c; }
        .brand { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .brand span { color: #ea580c; }
        .badge { display: inline-block; background: rgba(234, 88, 12, 0.15); border: 1px solid rgba(234, 88, 12, 0.3); color: #ea580c; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; margin-top: 6px; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .paragraph { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25); }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; }
        .details-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .details-label { color: #64748b; font-weight: 500; }
        .details-value { color: #0f172a; font-weight: 600; }
        .security-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; font-size: 12px; color: #92400e; border-radius: 0 8px 8px 0; margin-top: 24px; }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .raw-link { word-break: break-all; color: #ea580c; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">precise<span>3dm</span></div>
          <div class="badge">Account Invitation</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name || "there"},</div>
          <p class="paragraph">
            You have been invited${inviterText} to join the <strong>Precise3DM</strong> workspace as a <strong>${roleLabel}</strong>.
          </p>
          <div class="details-box">
            <div class="details-row"><span class="details-label">Assigned Role:</span> <span class="details-value">${roleLabel}</span></div>
            <div class="details-row"><span class="details-label">Email:</span> <span class="details-value">${to}</span></div>
            <div class="details-row"><span class="details-label">Token Expiry:</span> <span class="details-value">24 Hours</span></div>
          </div>
          <p class="paragraph">
            To activate your account and securely set your login password, please click the button below:
          </p>
          <div class="btn-wrapper">
            <a href="${activationUrl}" target="_blank" class="btn">Set Password / Activate Account</a>
          </div>
          <div class="security-notice">
            <strong>Security Notice:</strong> This activation link is unique, single-use, and will expire in 24 hours. No plain-text passwords are ever sent or stored.
          </div>
          <p class="paragraph" style="margin-top: 24px; font-size: 12px; color: #64748b;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${activationUrl}" class="raw-link">${activationUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Precise3DM Workspace. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${name || "there"},

You have been invited to join the Precise3DM workspace as a ${roleLabel}.

To activate your account and securely choose your password, visit the link below (valid for 24 hours):
${activationUrl}

Security Notice: This link is unique and one-time use. Never share this email.
`;

  const transporter = await createTransporter();
  const mailOptions = {
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  const emailRecord = {
    type: "invitation",
    to,
    name,
    token,
    activationUrl,
    subject,
    sentAt: new Date(),
    info,
  };
  sentEmailsLog.push(emailRecord);

  console.log(`[Email Service] Invitation email sent to ${to}. Activation link: ${activationUrl}`);
  return emailRecord;
};

/**
 * Send a password reset email with a secure one-time reset link
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const clientUrl = getClientUrl();
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your Precise3DM Workspace Password";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #0f172a; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 28px 32px; text-align: left; border-bottom: 3px solid #ea580c; }
        .brand { font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
        .brand span { color: #ea580c; }
        .badge { display: inline-block; background: rgba(234, 88, 12, 0.15); border: 1px solid rgba(234, 88, 12, 0.3); color: #ea580c; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; margin-top: 6px; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .paragraph { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.25); }
        .security-notice { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; font-size: 12px; color: #92400e; border-radius: 0 8px 8px 0; margin-top: 24px; }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        .raw-link { word-break: break-all; color: #ea580c; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">precise<span>3dm</span></div>
          <div class="badge">Password Reset</div>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name || "there"},</div>
          <p class="paragraph">
            We received a request to reset the password for your <strong>Precise3DM</strong> account.
          </p>
          <p class="paragraph">
            To choose a new password and regain access to your account, click the button below:
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
          </div>
          <div class="security-notice">
            <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email; your account remains secure.
          </div>
          <p class="paragraph" style="margin-top: 24px; font-size: 12px; color: #64748b;">
            If the button doesn't work, copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" class="raw-link">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Precise3DM Workspace. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${name || "there"},

We received a request to reset the password for your Precise3DM account.

To choose a new password, click the link below (valid for 1 hour):
${resetUrl}

If you did not request this password reset, please ignore this email.
`;

  const transporter = await createTransporter();
  const mailOptions = {
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  const emailRecord = {
    type: "password_reset",
    to,
    name,
    token,
    resetUrl,
    subject,
    sentAt: new Date(),
    info,
  };
  sentEmailsLog.push(emailRecord);

  console.log(`[Email Service] Password reset email sent to ${to}. Reset link: ${resetUrl}`);
  return emailRecord;
};
