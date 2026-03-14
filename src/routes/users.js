import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

const makeToken = (user) => jwt.sign(
  { id: user._id, email: user.email, plan: user.plan, isAdmin: user.isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const loginAttempts = {};

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ name, email, passwordHash, oauthProvider: 'local' });
    await user.save();

    const token = makeToken(user);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const ip = req.ip;
    const now = Date.now();
    if (!loginAttempts[ip]) loginAttempts[ip] = [];
    loginAttempts[ip] = loginAttempts[ip].filter(t => now - t < 900000);
    if (loginAttempts[ip].length >= 10) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    loginAttempts[ip].push(now);

    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('solved', 'number title difficulty').populate('bookmarked', 'number title difficulty');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = makeToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/oauth — Firebase OAuth sync
router.post('/oauth', async (req, res) => {
  try {
    const { name, email, oauthProvider, oauthId, avatarUrl } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, oauthProvider, oauthId, avatarUrl });
      await user.save();
    }

    const token = makeToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solved', 'number title difficulty slug')
      .populate('attempted', 'number title difficulty slug')
      .populate('bookmarked', 'number title difficulty slug');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me — update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'github', 'linkedin', 'langPref', 'plan'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.name) updates.initials = updates.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .populate('solved', 'number title difficulty slug');
    res.json(sanitize(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/bookmark/:problemId
router.post('/bookmark/:problemId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const pid = req.params.problemId;
    const idx = user.bookmarked.indexOf(pid);
    if (idx === -1) user.bookmarked.push(pid);
    else user.bookmarked.splice(idx, 1);
    await user.save();
    res.json({ bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name initials rating ratingTitle plan streak solved')
      .sort({ rating: -1 })
      .limit(50);
    res.json(users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      initials: u.initials,
      rating: u.rating,
      ratingTitle: u.ratingTitle,
      plan: u.plan,
      streak: u.streak,
      solved: u.solved.length,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ROUTES ──────────────────────────────

// GET /api/users — all users (admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/plan — toggle pro (admin)
router.patch('/:id/plan', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.plan = user.plan === 'pro' ? 'free' : 'pro';
    if (user.plan === 'pro') user.proSince = new Date();
    await user.save();
    res.json({ plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ error: 'Cannot delete admin users' });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/admin-login — admin-specific login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isAdmin: true });
    if (!user) return res.status(401).json({ error: 'Invalid admin credentials' });
    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) return res.status(401).json({ error: 'Invalid admin credentials' });
    const token = makeToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function sanitize(user) {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash;
  delete u.oauthId;
  return u;
}

export default router;
