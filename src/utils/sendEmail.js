import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Verification email (2 min expiry) ─────────────────────────────────────
export async function sendVerificationEmail(toEmail, name, token) {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"CodeForge" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject: 'Verify your CodeForge email address',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#e0e0e0;border-radius:12px;padding:40px;">
        <h2 style="color:#00d084;margin:0 0 6px;">Welcome to CodeForge, ${name.split(' ')[0]}!</h2>
        <p style="color:#aaa;font-size:14px;margin:0 0 32px;">
          You're one step away. Click the button below to verify your email and activate your account.
        </p>

        <a href="${url}"
           style="display:inline-block;background:#00d084;color:#000;text-decoration:none;
                  padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:.3px;">
          Verify Email Address →
        </a>

        <p style="color:#555;font-size:13px;margin-top:32px;line-height:1.6;">
          This link expires in <strong style="color:#aaa">2 minutes</strong>.<br/>
          If you didn't create a CodeForge account, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #222;margin:32px 0"/>
        <p style="color:#333;font-size:11px;margin:0;">
          CodeForge · The platform built for developers who want to get hired
        </p>
      </div>
    `,
  });
}

// ── Registration OTP email ─────────────────────────────────────────────────
export async function sendVerificationOtp(toEmail, name, otp) {
  await transporter.sendMail({
    from: `"CodeForge" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject: 'Your CodeForge verification code',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#e0e0e0;border-radius:12px;padding:40px;">
        <h2 style="color:#00d084;margin:0 0 6px;">Welcome to CodeForge, ${name.split(' ')[0]}!</h2>
        <p style="color:#aaa;font-size:14px;margin:0 0 28px;">
          Enter the code below to verify your email and activate your account.
        </p>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
          <p style="color:#666;font-size:12px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Your verification code</p>
          <p style="color:#00d084;font-size:40px;font-weight:800;letter-spacing:16px;margin:0;font-family:monospace;">
            ${otp}
          </p>
        </div>

        <p style="color:#555;font-size:13px;line-height:1.6;">
          This code expires in <strong style="color:#aaa">2 minutes</strong>.<br/>
          You have <strong style="color:#aaa">3 attempts</strong> before the code is locked.<br/>
          If you didn't create a CodeForge account, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #222;margin:32px 0"/>
        <p style="color:#333;font-size:11px;margin:0;">
          CodeForge · The platform built for developers who want to get hired
        </p>
      </div>
    `,
  });
}

// ── Password reset OTP email ───────────────────────────────────────────────
export async function sendPasswordResetOtp(toEmail, name, otp) {
  await transporter.sendMail({
    from: `"CodeForge" <${process.env.GMAIL_USER}>`,
    to:   toEmail,
    subject: 'Your CodeForge password reset code',
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;color:#e0e0e0;border-radius:12px;padding:40px;">
        <h2 style="color:#00d084;margin:0 0 6px;">Password Reset</h2>
        <p style="color:#aaa;font-size:14px;margin:0 0 28px;">
          Hi ${name.split(' ')[0]}, use the code below to reset your CodeForge password.
        </p>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
          <p style="color:#666;font-size:12px;margin:0 0 12px;letter-spacing:1px;text-transform:uppercase;">Your verification code</p>
          <p style="color:#00d084;font-size:40px;font-weight:800;letter-spacing:16px;margin:0;font-family:monospace;">
            ${otp}
          </p>
        </div>

        <p style="color:#555;font-size:13px;line-height:1.6;">
          This code expires in <strong style="color:#aaa">2 minutes</strong>.<br/>
          You have <strong style="color:#aaa">3 attempts</strong> before the code is locked.<br/>
          If you didn't request this, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #222;margin:32px 0"/>
        <p style="color:#333;font-size:11px;margin:0;">
          CodeForge · The platform built for developers who want to get hired
        </p>
      </div>
    `,
  });
}
