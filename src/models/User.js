import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, default: null },
  initials:     { type: String, default: '' },
  bio:          { type: String, default: '' },
  github:       { type: String, default: '' },
  linkedin:     { type: String, default: '' },
  avatarUrl:    { type: String, default: '' },
  oauthProvider:{ type: String, enum: ['google', 'github', 'local', 'admin'], default: 'local' },
  oauthId:      { type: String, default: null, sparse: true },

  // ── Email verification OTP ─────────────────────────────────────
  isVerified:            { type: Boolean, default: false },
  verifyOtp:             { type: String,  default: null }, // hashed 6-digit OTP
  verifyOtpExpires:      { type: Date,    default: null }, // 2 min expiry
  verifyOtpAttempts:     { type: Number,  default: 0    }, // wrong attempts
  verifyOtpLockedUntil:  { type: Date,    default: null }, // locked after 3 wrong
  verifyOtpSentAt:       { type: Date,    default: null }, // resend cooldown

  // ── Legacy link-based verification fields (kept for DB compatibility) ──
  verificationToken:     { type: String,  default: null },
  verificationExpires:   { type: Date,    default: null },

  // ── Refresh token (stored hashed) ─────────────────────────────
  refreshTokenHash: { type: String, default: null },

  // ── Password reset OTP ─────────────────────────────────────────
  resetOtp:          { type: String,  default: null }, // 6-digit OTP (hashed)
  resetOtpExpires:   { type: Date,    default: null }, // 2 min expiry
  resetOtpAttempts:  { type: Number,  default: 0    }, // wrong attempts counter
  resetOtpLockedUntil:{ type: Date,   default: null }, // locked after 3 wrong attempts
  resetOtpSentAt:    { type: Date,    default: null }, // for 2-min resend cooldown

  rating:       { type: Number, default: 0 },
  ratingTitle:  { type: String, default: 'Beginner' },
  streak:       { type: Number, default: 0 },
  streakLast:   { type: String, default: null },
  coins:        { type: Number, default: 0 },
  plan:         { type: String, enum: ['free', 'pro'], default: 'free' },
  proSince:     { type: Date,   default: null },
  lastPaymentId:{ type: String, default: null },
  lastOrderId:  { type: String, default: null },
  langPref:     { type: String, default: 'python' },
  solved:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  attempted:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  bookmarked:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  isAdmin:      { type: Boolean, default: false },
}, {
  timestamps: true,
  autoIndex:  false,
});

UserSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.initials) {
    this.initials = this.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  next();
});

export default mongoose.model('User', UserSchema);
