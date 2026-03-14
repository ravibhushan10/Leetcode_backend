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

// GET /api/users/ml-insights — Premium ML features data
router.get('/ml-insights', authMiddleware, async (req, res) => {
  try {
    const Submission = (await import('../models/Submission.js')).default;

    const user = await User.findById(req.user.id)
      .populate('solved', 'tags difficulty companies number title slug')
      .populate('attempted', 'tags difficulty');

    // Fetch all submissions for this user with problem tags
    const submissions = await Submission.find({ user: req.user.id })
      .populate('problem', 'tags difficulty companies title slug number')
      .sort({ createdAt: -1 })
      .limit(200);

    // ── 1. Weakness Analysis per Tag ─────────────────────────────
    const tagStats = {};
    for (const sub of submissions) {
      if (!sub.problem) continue;
      for (const tag of (sub.problem.tags || [])) {
        if (!tagStats[tag]) tagStats[tag] = { total: 0, accepted: 0, tag };
        tagStats[tag].total++;
        if (sub.verdict === 'Accepted') tagStats[tag].accepted++;
      }
    }

    // Convert to accuracy scores (0–100)
    const tagScores = Object.values(tagStats)
      .filter(t => t.total >= 1)
      .map(t => ({
        tag:      t.tag,
        accuracy: Math.round((t.accepted / t.total) * 100),
        total:    t.total,
        accepted: t.accepted,
      }))
      .sort((a, b) => a.accuracy - b.accuracy); // weakest first

    // Top 8 tags for radar chart
    const allTags = ['Array', 'Dynamic Programming', 'Graph', 'Tree', 'String', 'Binary Search', 'Hash Table', 'Recursion'];
    const radarData = allTags.map(tag => {
      const found = tagScores.find(t => t.tag === tag);
      return {
        tag,
        accuracy: found ? found.accuracy : 0,
        attempted: found ? found.total : 0,
      };
    });

    // ── 2. Interview Readiness Score per Company ─────────────────
    const companies = ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple'];
    const solvedTitles = new Set((user.solved || []).map(p => p.title));

    const readiness = companies.map(company => {
      const companyProblems = (user.solved || []).filter(p =>
        (p.companies || []).includes(company)
      ).length;

      // Score formula: solved company problems + difficulty weighting + accuracy
      const diffScore = (user.solved || []).reduce((acc, p) => {
        if (!(p.companies || []).includes(company)) return acc;
        return acc + (p.difficulty === 'Easy' ? 1 : p.difficulty === 'Medium' ? 2 : 3);
      }, 0);

      const maxScore = 50; // assume 50 company problems total
      const raw = Math.min(100, Math.round((diffScore / maxScore) * 100));
      return { company, score: Math.max(5, raw), problemsSolved: companyProblems };
    });

    // ── 3. Smart Recommendations ─────────────────────────────────
    // Find tags user is weakest at, recommend unsolved problems in those tags
    const solvedIds = new Set((user.solved || []).map(p => p._id.toString()));
    const weakTags  = tagScores.slice(0, 3).map(t => t.tag); // 3 weakest tags

    // Also include tags user has never attempted
    const attemptedTags = new Set(tagScores.map(t => t.tag));
    const neverTried = allTags.filter(t => !attemptedTags.has(t)).slice(0, 2);
    const targetTags = [...new Set([...weakTags, ...neverTried])];

    const recommended = await Problem.find({
      tags:   { $in: targetTags.length ? targetTags : allTags },
      hidden: false,
    })
    .select('number title slug difficulty tags acceptance companies premium')
    .limit(50);

    // Filter out already solved, sort by difficulty then acceptance
    const diffOrder = { Easy: 0, Medium: 1, Hard: 2 };
    const recs = recommended
      .filter(p => !solvedIds.has(p._id.toString()))
      .sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty])
      .slice(0, 8)
      .map(p => ({
        _id:        p._id,
        number:     p.number,
        title:      p.title,
        slug:       p.slug,
        difficulty: p.difficulty,
        tags:       p.tags,
        acceptance: p.acceptance,
        premium:    p.premium,
        reason:     targetTags.find(t => p.tags.includes(t)) || p.tags[0],
      }));

    // ── 4. Study Plan Progress ────────────────────────────────────
    const totalSolved = user.solved?.length || 0;
    const easySolved  = (user.solved || []).filter(p => p.difficulty === 'Easy').length;
    const medSolved   = (user.solved || []).filter(p => p.difficulty === 'Medium').length;
    const hardSolved  = (user.solved || []).filter(p => p.difficulty === 'Hard').length;

    // 30-day plan milestones
    const plan = [
      { label: 'Easy Foundation',   target: 20, current: easySolved,  color: '#00d084' },
      { label: 'Medium Proficiency',target: 40, current: medSolved,   color: '#ff9f43' },
      { label: 'Hard Mastery',       target: 10, current: hardSolved,  color: '#ff5c5c' },
      { label: 'Total Problems',     target: 70, current: totalSolved, color: '#9d6fff' },
    ];

    // ── 5. Submission Timeline (last 30 days) ─────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentSubs = submissions.filter(s => new Date(s.createdAt) > thirtyDaysAgo);
    const timelineMap = {};
    for (const sub of recentSubs) {
      const day = new Date(sub.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!timelineMap[day]) timelineMap[day] = { day, total: 0, accepted: 0 };
      timelineMap[day].total++;
      if (sub.verdict === 'Accepted') timelineMap[day].accepted++;
    }
    const timeline = Object.values(timelineMap).sort((a, b) => a.day.localeCompare(b.day));

    res.json({
      radarData,
      tagScores:       tagScores.slice(0, 10),
      readiness,
      recommendations: recs,
      studyPlan:       plan,
      timeline,
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
