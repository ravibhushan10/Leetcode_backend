import express       from 'express';
import bcrypt        from 'bcryptjs';
import jwt           from 'jsonwebtoken';
import crypto        from 'crypto';
import User          from '../models/User.js';
import Problem       from '../models/Problem.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { sendVerificationEmail, sendVerificationOtp, sendPasswordResetOtp } from '../utils/sendEmail.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, plan: user.plan, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function makeRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1y' }
  );
}

// Issue both tokens: access token in JSON body + refresh token in httpOnly cookie
async function issueTokens(user, res) {
  const accessToken  = makeAccessToken(user);
  const refreshToken = makeRefreshToken(user);

  // Hash refresh token before storing (DB leak = useless tokens)
  const hash = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: hash });

  res.cookie('cf_refresh', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   365 * 24 * 60 * 60 * 1000, // 1 year
  });

  return accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting (in-memory, per IP)
// ─────────────────────────────────────────────────────────────────────────────

const loginAttempts = {};

function checkRateLimit(ip) {
  const now = Date.now();
  if (!loginAttempts[ip]) loginAttempts[ip] = [];
  loginAttempts[ip] = loginAttempts[ip].filter(t => now - t < 15 * 60 * 1000); // 15 min window
  if (loginAttempts[ip].length >= 10) return false;
  loginAttempts[ip].push(now);
  return true;
}

function remainingAttempts(ip) {
  const now = Date.now();
  const recent = (loginAttempts[ip] || []).filter(t => now - t < 15 * 60 * 1000);
  return Math.max(0, 10 - recent.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/register
// ─────────────────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── Field validation ─────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    // ── Email format check ───────────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // ── Password strength ────────────────────────────────────────
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // ── Check if email already exists ────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      if (existing.oauthProvider === 'google' || existing.oauthProvider === 'github') {
        return res.status(409).json({
          error: 'This email is already registered via Google or GitHub. Please sign in using one of those buttons above.',
          code:  'USE_OAUTH',
        });
      }
      if (!existing.isVerified) {
        // Check resend cooldown
        if (existing.verifyOtpSentAt && (Date.now() - existing.verifyOtpSentAt.getTime()) < 2 * 60 * 1000) {
          return res.status(409).json({
            error: 'This email is registered but not yet verified. A code was recently sent — check your inbox.',
            code:  'UNVERIFIED_EXISTS',
            email: existing.email,
          });
        }
        // Re-send a fresh OTP
        const otp    = String(Math.floor(100000 + Math.random() * 900000));
        const hashed = await bcrypt.hash(otp, 10);
        existing.verifyOtp            = hashed;
        existing.verifyOtpExpires     = new Date(Date.now() + 2 * 60 * 1000);
        existing.verifyOtpAttempts    = 0;
        existing.verifyOtpLockedUntil = null;
        existing.verifyOtpSentAt      = new Date();
        await existing.save();
        try { await sendVerificationOtp(existing.email, existing.name, otp); } catch (e) {
          console.error('⚠️  Re-send OTP failed:', e.message);
        }
        return res.status(409).json({
          error: 'This email is registered but not yet verified. A new code has been sent to your inbox.',
          code:  'UNVERIFIED_EXISTS',
          email: existing.email,
        });
      }
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in.',
        code:  'EMAIL_TAKEN',
      });
    }

    // ── Create unverified account ─────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashed = await bcrypt.hash(otp, 10);

    const user = new User({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      oauthProvider:        'local',
      isVerified:           false,
      verifyOtp:            hashed,
      verifyOtpExpires:     new Date(Date.now() + 2 * 60 * 1000),
      verifyOtpAttempts:    0,
      verifyOtpLockedUntil: null,
      verifyOtpSentAt:      new Date(),
    });
    await user.save();

    // ── Send OTP email ────────────────────────────────────────────
    try {
      await sendVerificationOtp(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('⚠️  Verification OTP email failed:', emailErr.message);
    }

    return res.status(201).json({
      message: `We've sent a 6-digit code to ${user.email}. Enter it to activate your account.`,
      code:    'VERIFY_OTP',
      email:   user.email,
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/login
// ─────────────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const ip = req.ip;

    // ── Rate limiting ─────────────────────────────────────────────
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Too many login attempts. Please wait 15 minutes and try again.',
        code:  'RATE_LIMITED',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('solved',     'number title difficulty slug')
      .populate('attempted',  'number title difficulty slug')
      .populate('bookmarked', 'number title difficulty slug');

    // ── User not found — generic message (security: don't reveal if email exists) ──
    if (!user) {
      return res.status(401).json({
        error: 'Incorrect email or password.',
        code:  'INVALID_CREDENTIALS',
      });
    }

    // ── OAuth account trying password login ───────────────────────
    if (user.oauthProvider === 'google' && !user.passwordHash) {
      return res.status(401).json({
        error: 'This account uses Google sign-in. Please click "Continue with Google".',
        code:  'USE_GOOGLE',
      });
    }
    if (user.oauthProvider === 'github' && !user.passwordHash) {
      return res.status(401).json({
        error: 'This account uses GitHub sign-in. Please click "Continue with GitHub".',
        code:  'USE_GITHUB',
      });
    }

    // ── Password check ────────────────────────────────────────────
    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) {
      const left = remainingAttempts(ip);
      const hint = left <= 3 && left > 0
        ? ` ${left} attempt${left === 1 ? '' : 's'} remaining before lockout.`
        : left === 0
          ? ' Account temporarily locked. Try again in 15 minutes.'
          : '';
      return res.status(401).json({
        error: `Incorrect email or password.${hint}`,
        code:  'INVALID_CREDENTIALS',
      });
    }

    // ── Unverified account ────────────────────────────────────────
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in. Check your inbox for the verification link.',
        code:  'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    // ── All checks passed — issue tokens ─────────────────────────
    const accessToken = await issueTokens(user, res);

    return res.json({
      token: accessToken,
      user:  sanitize(user),
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/refresh — silent token refresh
// ─────────────────────────────────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.cf_refresh;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token.', code: 'NO_REFRESH_TOKEN' });
    }

    // Verify JWT signature
    let payload;
    try {
      payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      res.clearCookie('cf_refresh');
      return res.status(401).json({ error: 'Session expired. Please sign in again.', code: 'REFRESH_EXPIRED' });
    }

    const user = await User.findById(payload.id);
    if (!user || !user.refreshTokenHash) {
      res.clearCookie('cf_refresh');
      return res.status(401).json({ error: 'Session invalid. Please sign in again.', code: 'INVALID_SESSION' });
    }

    // Verify token matches stored hash
    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) {
      res.clearCookie('cf_refresh');
      return res.status(401).json({ error: 'Session invalid. Please sign in again.', code: 'INVALID_SESSION' });
    }

    // Issue new access token (rotate refresh token too)
    const accessToken = await issueTokens(user, res);
    return res.json({ token: accessToken });

  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/logout
// ─────────────────────────────────────────────────────────────────────────────

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Invalidate stored refresh token
    await User.findByIdAndUpdate(req.user.id, { refreshTokenHash: null });
    res.clearCookie('cf_refresh');
    return res.json({ message: 'Signed out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/verify-email?token=xxx
// ─────────────────────────────────────────────────────────────────────────────

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is missing.', code: 'NO_TOKEN' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        error: 'This verification link is invalid or has already been used.',
        code:  'INVALID_TOKEN',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        message: 'Your email is already verified. You can sign in.',
        code:    'ALREADY_VERIFIED',
      });
    }

    if (user.verificationExpires < new Date()) {
      return res.status(400).json({
        error: 'This verification link has expired. Please request a new one.',
        code:  'TOKEN_EXPIRED',
        email: user.email,
      });
    }

    // Activate account
    user.isVerified          = true;
    user.verificationToken   = null;
    user.verificationExpires = null;
    await user.save();

    // Auto-login after verification
    const accessToken = await issueTokens(user, res);

    return res.json({
      message: 'Email verified successfully! Welcome to CodeForge.',
      code:    'VERIFIED',
      token:   accessToken,
      user:    sanitize(user),
    });

  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/resend-verification
// ─────────────────────────────────────────────────────────────────────────────

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success even if email not found (security: don't reveal existence)
    if (!user || user.oauthProvider !== 'local') {
      return res.json({
        message: 'If that email is registered, a new verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: 'This account is already verified. Please sign in.',
        code:  'ALREADY_VERIFIED',
      });
    }

    // Throttle: don't allow resend if last token was issued < 2 minutes ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (user.verificationExpires && user.verificationExpires > new Date(Date.now())) {
      // Token was created less than 2 minutes ago
      return res.status(429).json({
        error: 'A verification email was just sent. Please wait 2 minutes before requesting another.',
        code:  'RESEND_TOO_SOON',
      });
    }

    // Generate fresh token
    const verificationToken   = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 min
    user.verificationToken   = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailErr) {
      console.error('⚠️  Resend email failed:', emailErr.message);
      return res.status(500).json({ error: 'Failed to send email. Please try again in a moment.' });
    }

    return res.json({
      message: `A new verification link has been sent to ${user.email}. Please check your inbox.`,
    });

  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/verify-otp-register — verify 6-digit OTP during registration
// ─────────────────────────────────────────────────────────────────────────────

router.post('/verify-otp-register', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('solved',     'number title difficulty slug')
      .populate('attempted',  'number title difficulty slug')
      .populate('bookmarked', 'number title difficulty slug');

    if (!user || !user.verifyOtp) {
      return res.status(400).json({ error: 'No verification code found. Please register again.', code: 'NO_OTP' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified. Please sign in.', code: 'ALREADY_VERIFIED' });
    }

    // Check if locked
    if (user.verifyOtpLockedUntil && user.verifyOtpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.verifyOtpLockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Too many wrong attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        code:  'OTP_LOCKED',
        minutesLeft,
      });
    }

    // Check expiry
    if (user.verifyOtpExpires < new Date()) {
      return res.status(400).json({
        error: 'This code has expired. Please request a new one.',
        code:  'OTP_EXPIRED',
      });
    }

    // Verify OTP
    const valid = await bcrypt.compare(String(otp), user.verifyOtp);
    if (!valid) {
      user.verifyOtpAttempts = (user.verifyOtpAttempts || 0) + 1;
      if (user.verifyOtpAttempts >= 3) {
        user.verifyOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.verifyOtp            = null;
        user.verifyOtpExpires     = null;
        await user.save();
        return res.status(429).json({
          error: 'Too many wrong attempts. Account locked for 15 minutes.',
          code:  'OTP_LOCKED',
          minutesLeft: 15,
        });
      }
      await user.save();
      const attemptsLeft = 3 - user.verifyOtpAttempts;
      return res.status(400).json({
        error: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
        code:  'OTP_INVALID',
        attemptsLeft,
      });
    }

    // OTP valid — activate account
    user.isVerified           = true;
    user.verifyOtp            = null;
    user.verifyOtpExpires     = null;
    user.verifyOtpAttempts    = 0;
    user.verifyOtpLockedUntil = null;
    user.verifyOtpSentAt      = null;
    await user.save();

    // Issue tokens and log them in immediately
    const accessToken = await issueTokens(user, res);

    return res.json({
      message: 'Email verified! Welcome to CodeForge.',
      token:   accessToken,
      user:    sanitize(user),
    });

  } catch (err) {
    console.error('Verify register OTP error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/resend-verify-otp — resend registration OTP
// ─────────────────────────────────────────────────────────────────────────────

router.post('/resend-verify-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || user.oauthProvider !== 'local') {
      return res.status(400).json({ error: 'No account found for this email.', code: 'NOT_FOUND' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This account is already verified. Please sign in.', code: 'ALREADY_VERIFIED' });
    }

    // Check if locked
    if (user.verifyOtpLockedUntil && user.verifyOtpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.verifyOtpLockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        code:  'OTP_LOCKED',
        minutesLeft,
      });
    }

    // Resend cooldown — 2 minutes between sends
    if (user.verifyOtpSentAt && (Date.now() - user.verifyOtpSentAt.getTime()) < 2 * 60 * 1000) {
      const secondsLeft = Math.ceil((2 * 60 * 1000 - (Date.now() - user.verifyOtpSentAt.getTime())) / 1000);
      return res.status(429).json({
        error: `Please wait ${secondsLeft} seconds before requesting another code.`,
        code:  'OTP_COOLDOWN',
        secondsLeft,
      });
    }

    // Generate fresh OTP
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashed = await bcrypt.hash(otp, 10);

    user.verifyOtp            = hashed;
    user.verifyOtpExpires     = new Date(Date.now() + 2 * 60 * 1000);
    user.verifyOtpAttempts    = 0;
    user.verifyOtpLockedUntil = null;
    user.verifyOtpSentAt      = new Date();
    await user.save();

    try {
      await sendVerificationOtp(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('⚠️  Resend OTP email failed:', emailErr.message);
      return res.status(500).json({ error: 'Failed to send code. Please try again.' });
    }

    return res.json({
      message: `A new 6-digit code has been sent to ${user.email}.`,
      email:   user.email,
    });

  } catch (err) {
    console.error('Resend verify OTP error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/forgot-password — send OTP to email
// ─────────────────────────────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond the same — don't reveal if email exists
    if (!user || user.oauthProvider !== 'local') {
      return res.json({
        message: 'If that email has an account, a reset code has been sent.',
      });
    }

    // Check resend cooldown — only 1 resend allowed per 2 min
    if (user.resetOtpSentAt && (Date.now() - user.resetOtpSentAt.getTime()) < 2 * 60 * 1000) {
      const secondsLeft = Math.ceil((2 * 60 * 1000 - (Date.now() - user.resetOtpSentAt.getTime())) / 1000);
      return res.status(429).json({
        error: `Please wait ${secondsLeft} seconds before requesting another code.`,
        code:  'OTP_COOLDOWN',
        secondsLeft,
      });
    }

    // Generate 6-digit OTP
    const otp    = String(Math.floor(100000 + Math.random() * 900000));
    const hashed = await bcrypt.hash(otp, 10);

    user.resetOtp           = hashed;
    user.resetOtpExpires    = new Date(Date.now() + 2 * 60 * 1000); // 2 min
    user.resetOtpAttempts   = 0;
    user.resetOtpLockedUntil = null;
    user.resetOtpSentAt     = new Date();
    await user.save();

    try {
      await sendPasswordResetOtp(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
      return res.status(500).json({ error: 'Failed to send reset code. Please try again.' });
    }

    return res.json({
      message: `A 6-digit reset code has been sent to ${user.email}. Valid for 2 minutes.`,
      email:   user.email,
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/verify-otp — verify the 6-digit OTP
// ─────────────────────────────────────────────────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ error: 'No reset code found. Please request a new one.', code: 'NO_OTP' });
    }

    // Check if locked
    if (user.resetOtpLockedUntil && user.resetOtpLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.resetOtpLockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Too many wrong attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        code:  'OTP_LOCKED',
        minutesLeft,
      });
    }

    // Check expiry
    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({
        error: 'This code has expired. Please request a new one.',
        code:  'OTP_EXPIRED',
      });
    }

    // Verify OTP
    const valid = await bcrypt.compare(String(otp), user.resetOtp);
    if (!valid) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;

      if (user.resetOtpAttempts >= 3) {
        user.resetOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        user.resetOtp            = null;
        user.resetOtpExpires     = null;
        await user.save();
        return res.status(429).json({
          error: 'Too many wrong attempts. Account locked for 15 minutes.',
          code:  'OTP_LOCKED',
          minutesLeft: 15,
        });
      }

      await user.save();
      const attemptsLeft = 3 - user.resetOtpAttempts;
      return res.status(400).json({
        error: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
        code:  'OTP_INVALID',
        attemptsLeft,
      });
    }

    // OTP valid — issue a short-lived reset session token
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' } // 10 min to complete the reset
    );

    // Clear OTP fields
    user.resetOtp            = null;
    user.resetOtpExpires     = null;
    user.resetOtpAttempts    = 0;
    user.resetOtpLockedUntil = null;
    await user.save();

    return res.json({
      message:     'Code verified. You can now set a new password.',
      resetToken,
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/reset-password — set new password using reset token
// ─────────────────────────────────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    // Verify reset token
    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: 'Reset session expired. Please start over.',
        code:  'RESET_TOKEN_EXPIRED',
      });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(401).json({ error: 'Invalid reset token.' });
    }

    // Strong password validation
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]).{8,}$/;
    if (!pwdRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
        code:  'WEAK_PASSWORD',
      });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    return res.json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/oauth — Google / GitHub OAuth
// ─────────────────────────────────────────────────────────────────────────────

router.post('/oauth', async (req, res) => {
  try {
    const { name, email, oauthProvider, oauthId, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required for OAuth sign-in.' });
    }
    if (!oauthProvider || !['google', 'github'].includes(oauthProvider)) {
      return res.status(400).json({ error: 'Invalid OAuth provider.' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Account exists — allow any OAuth provider for same email.
      // This lets users log in with Google OR GitHub interchangeably,
      // which is the standard behaviour on LeetCode, GitHub, etc.
      // Just update the provider to whichever they used most recently
      // and keep their existing data intact.
      user.oauthProvider = oauthProvider;
      user.oauthId       = oauthId;
      if (avatarUrl && !user.avatarUrl) user.avatarUrl = avatarUrl;
      user.isVerified    = true; // OAuth = email verified by provider
      await user.save();
    } else {
      // New user via OAuth — auto-verified
      user = new User({
        name:          name || email.split('@')[0],
        email:         email.toLowerCase().trim(),
        oauthProvider,
        oauthId,
        avatarUrl:     avatarUrl || '',
        isVerified:    true, // OAuth emails are verified by the provider
      });
      await user.save();
    }

    const accessToken = await issueTokens(user, res);

    return res.json({
      token: accessToken,
      user:  sanitize(user),
    });

  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ error: 'OAuth sign-in failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me
// ─────────────────────────────────────────────────────────────────────────────

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solved',     'number title difficulty slug')
      .populate('attempted',  'number title difficulty slug')
      .populate('bookmarked', 'number title difficulty slug');

    if (!user) {
      return res.status(404).json({ error: 'Account not found. It may have been deleted.' });
    }
    return res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/me — update profile
// ─────────────────────────────────────────────────────────────────────────────

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'github', 'linkedin', 'langPref', 'plan'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.name) {
      if (updates.name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      updates.initials = updates.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .populate('solved', 'number title difficulty slug');

    if (!user) return res.status(404).json({ error: 'Account not found.' });
    return res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/bookmark/:problemId
// ─────────────────────────────────────────────────────────────────────────────

router.post('/bookmark/:problemId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const pid = req.params.problemId;
    const idx = user.bookmarked.indexOf(pid);
    if (idx === -1) user.bookmarked.push(pid);
    else user.bookmarked.splice(idx, 1);
    await user.save();

    return res.json({ bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/ml-insights
// ─────────────────────────────────────────────────────────────────────────────

router.get('/ml-insights', authMiddleware, async (req, res) => {
  try {
    const Submission = (await import('../models/Submission.js')).default;

    const user = await User.findById(req.user.id)
      .populate('solved',    'tags difficulty companies number title slug')
      .populate('attempted', 'tags difficulty');

    const submissions = await Submission.find({ user: req.user.id })
      .populate('problem', 'tags difficulty companies title slug number')
      .sort({ createdAt: -1 })
      .limit(200);

    const tagStats = {};
    for (const sub of submissions) {
      if (!sub.problem) continue;
      for (const tag of (sub.problem.tags || [])) {
        if (!tagStats[tag]) tagStats[tag] = { total: 0, accepted: 0, tag };
        tagStats[tag].total++;
        if (sub.verdict === 'Accepted') tagStats[tag].accepted++;
      }
    }

    const tagScores = Object.values(tagStats)
      .filter(t => t.total >= 1)
      .map(t => ({
        tag:      t.tag,
        accuracy: Math.round((t.accepted / t.total) * 100),
        total:    t.total,
        accepted: t.accepted,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const allTags = ['Array', 'Dynamic Programming', 'Graph', 'Tree', 'String', 'Binary Search', 'Hash Table', 'Recursion'];
    const radarData = allTags.map(tag => {
      const found = tagScores.find(t => t.tag === tag);
      return { tag, accuracy: found ? found.accuracy : 0, attempted: found ? found.total : 0 };
    });

    const companies = ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple'];
    const readiness = companies.map(company => {
      const diffScore = (user.solved || []).reduce((acc, p) => {
        if (!(p.companies || []).includes(company)) return acc;
        return acc + (p.difficulty === 'Easy' ? 1 : p.difficulty === 'Medium' ? 2 : 3);
      }, 0);
      const companyProblems = (user.solved || []).filter(p => (p.companies || []).includes(company)).length;
      const raw = Math.min(100, Math.round((diffScore / 50) * 100));
      return { company, score: Math.max(5, raw), problemsSolved: companyProblems };
    });

    const solvedIds  = new Set((user.solved || []).map(p => p._id.toString()));
    const weakTags   = tagScores.slice(0, 3).map(t => t.tag);
    const attemptedTags = new Set(tagScores.map(t => t.tag));
    const neverTried = allTags.filter(t => !attemptedTags.has(t)).slice(0, 2);
    const targetTags = [...new Set([...weakTags, ...neverTried])];

    const recommended = await Problem.find({
      tags:   { $in: targetTags.length ? targetTags : allTags },
      hidden: false,
    }).select('number title slug difficulty tags acceptance companies premium').limit(50);

    const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
    const recs = recommended
      .filter(p => !solvedIds.has(p._id.toString()))
      .sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty])
      .slice(0, 8)
      .map(p => ({
        _id: p._id, number: p.number, title: p.title, slug: p.slug,
        difficulty: p.difficulty, tags: p.tags, acceptance: p.acceptance,
        premium: p.premium, reason: targetTags.find(t => p.tags.includes(t)) || p.tags[0],
      }));

    const totalSolved = user.solved?.length || 0;
    const easySolved  = (user.solved || []).filter(p => p.difficulty === 'Easy').length;
    const medSolved   = (user.solved || []).filter(p => p.difficulty === 'Medium').length;
    const hardSolved  = (user.solved || []).filter(p => p.difficulty === 'Hard').length;

    const plan = [
      { label: 'Easy Foundation',    target: 20, current: easySolved,  color: '#00d084' },
      { label: 'Medium Proficiency', target: 40, current: medSolved,   color: '#ff9f43' },
      { label: 'Hard Mastery',       target: 10, current: hardSolved,  color: '#ff5c5c' },
      { label: 'Total Problems',     target: 70, current: totalSolved, color: '#9d6fff' },
    ];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentSubs    = submissions.filter(s => new Date(s.createdAt) > thirtyDaysAgo);
    const timelineMap   = {};
    for (const sub of recentSubs) {
      const day = new Date(sub.createdAt).toLocaleDateString('en-CA');
      if (!timelineMap[day]) timelineMap[day] = { day, total: 0, accepted: 0 };
      timelineMap[day].total++;
      if (sub.verdict === 'Accepted') timelineMap[day].accepted++;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.day.localeCompare(b.day));

    return res.json({
      radarData, tagScores: tagScores.slice(0, 10),
      readiness, recommendations: recs, studyPlan: plan, timeline,
      stats: {
        totalSolved, easySolved, medSolved, hardSolved,
        totalSubmissions: submissions.length,
        acceptanceRate: submissions.length
          ? Math.round((submissions.filter(s => s.verdict === 'Accepted').length / submissions.length) * 100)
          : 0,
        streak: user.streak || 0,
      },
    });
  } catch (err) {
    console.error('ML insights error:', err);
    res.status(500).json({ error: 'Something went wrong loading insights.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/leaderboard
// ─────────────────────────────────────────────────────────────────────────────

router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false, isVerified: true })
      .select('name initials rating ratingTitle plan streak solved')
      .sort({ rating: -1 })
      .limit(50);
    return res.json(users.map((u, i) => ({
      rank: i + 1, name: u.name, initials: u.initials,
      rating: u.rating, ratingTitle: u.ratingTitle,
      plan: u.plan, streak: u.streak, solved: u.solved.length,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong loading the leaderboard.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN routes
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.patch('/:id/plan', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.plan = user.plan === 'pro' ? 'free' : 'pro';
    if (user.plan === 'pro') user.proSince = new Date();
    await user.save();
    return res.json({ plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)       return res.status(404).json({ error: 'User not found.' });
    if (user.isAdmin) return res.status(403).json({ error: 'Cannot delete admin accounts.' });
    await user.deleteOne();
    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim(), isAdmin: true });
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = makeAccessToken(user);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup job — delete unverified accounts older than 24h
// Call this from a cron or on server startup
// ─────────────────────────────────────────────────────────────────────────────

export async function cleanupUnverifiedAccounts() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      isVerified: false,
      createdAt:  { $lt: cutoff },
    });
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} unverified account(s)`);
    }
  } catch (err) {
    console.error('Cleanup job error:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitize — strip sensitive fields before sending to client
// ─────────────────────────────────────────────────────────────────────────────

function sanitize(user) {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash;
  delete u.refreshTokenHash;
  // verification link fields
  delete u.verificationToken;
  delete u.verificationExpires;
  // registration OTP fields
  delete u.verifyOtp;
  delete u.verifyOtpExpires;
  delete u.verifyOtpAttempts;
  delete u.verifyOtpLockedUntil;
  delete u.verifyOtpSentAt;
  // password reset OTP fields
  delete u.resetOtp;
  delete u.resetOtpExpires;
  delete u.resetOtpAttempts;
  delete u.resetOtpLockedUntil;
  delete u.resetOtpSentAt;
  delete u.oauthId;
  return u;
}

export default router;
