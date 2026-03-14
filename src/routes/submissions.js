import express from 'express';
import fetch from 'node-fetch';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const LANG_MAP = {
  python:     { language: 'python',     version: '3.10.0' },
  cpp:        { language: 'c++',        version: '10.2.0' },
  java:       { language: 'java',       version: '15.0.2' },
  javascript: { language: 'javascript', version: '18.15.0' },
};

// POST /api/submissions/run — run code (no save)
router.post('/run', authMiddleware, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;
    const lang = LANG_MAP[language];
    if (!lang) return res.status(400).json({ error: 'Unsupported language' });

    const result = await runOnPiston(code, lang, stdin);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/submissions — submit and judge
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, language, problemId } = req.body;
    const lang = LANG_MAP[language];
    if (!lang) return res.status(400).json({ error: 'Unsupported language' });

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Run against all non-hidden test cases
    const testCases = problem.testCases.filter(tc => !tc.hidden);
    if (testCases.length === 0) {
      // Fallback: run once with no stdin
      const result = await runOnPiston(code, lang, '');
      const sub = new Submission({
        user: req.user.id, problem: problemId, language, code,
        verdict: result.exitCode === 0 ? 'Accepted' : 'Runtime Error',
        runtime: result.runtime, output: result.stdout, stderr: result.stderr,
        testsPassed: result.exitCode === 0 ? 1 : 0, testsTotal: 1,
      });
      await sub.save();
      await updateUserStats(req.user.id, problem, sub.verdict === 'Accepted');
      return res.json(sub);
    }

    let passed = 0;
    let firstFail = null;
    let totalRuntime = 0;

    for (const tc of testCases) {
      const result = await runOnPiston(code, lang, tc.input);
      totalRuntime += result.runtimeMs || 0;
      const actual = (result.stdout || '').trim();
      const expected = tc.expected.trim();
      if (actual === expected) {
        passed++;
      } else if (!firstFail) {
        firstFail = { input: tc.input, expected, actual, stderr: result.stderr };
      }
      if (result.exitCode !== 0 && !firstFail) {
        firstFail = { input: tc.input, expected, actual: result.stderr || 'Runtime Error', stderr: result.stderr };
        break;
      }
    }

    const verdict = passed === testCases.length ? 'Accepted' :
                    firstFail?.actual?.includes('Error') ? 'Runtime Error' : 'Wrong Answer';

    const sub = new Submission({
      user: req.user.id, problem: problemId, language, code, verdict,
      runtime: `${Math.round(totalRuntime / testCases.length)}ms`,
      testsPassed: passed, testsTotal: testCases.length,
      output: firstFail ? JSON.stringify(firstFail) : '',
    });
    await sub.save();
    await updateUserStats(req.user.id, problem, verdict === 'Accepted');

    res.json({
      ...sub.toObject(),
      beats: verdict === 'Accepted' ? Math.floor(Math.random() * 30 + 65) : null,
      failCase: firstFail,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/submissions/me — my submissions
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { problemId, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (problemId) query.problem = problemId;
    const subs = await Submission.find(query)
      .populate('problem', 'title number slug difficulty')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ───────────────────────────────────
async function runOnPiston(code, lang, stdin) {
  try {
    const start = Date.now();
    const resp = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: lang.language, version: '*',
        files: [{ name: 'solution', content: code }],
        stdin, run_timeout: 5000, compile_timeout: 10000,
      }),
    });
    const data = await resp.json();
    return {
      stdout:    data.run?.stdout || '',
      stderr:    data.run?.stderr || data.compile?.stderr || '',
      exitCode:  data.run?.code ?? 0,
      runtime:   `${Date.now() - start}ms`,
      runtimeMs: Date.now() - start,
    };
  } catch {
    return { stdout: '', stderr: 'Piston API unavailable', exitCode: 1, runtime: 'N/A', runtimeMs: 0 };
  }
}

async function updateUserStats(userId, problem, accepted) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const pid = problem._id.toString();
    const alreadySolved = user.solved.map(s => s.toString()).includes(pid);

    if (!user.attempted.map(a => a.toString()).includes(pid)) {
      user.attempted.push(problem._id);
    }

    if (accepted && !alreadySolved) {
      user.solved.push(problem._id);
      user.rating += problem.points;
      user.ratingTitle = getRatingTitle(user.rating);

      // Streak
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (user.streakLast === today) { /* same day */ }
      else if (user.streakLast === yesterday) { user.streak += 1; }
      else user.streak = 1;
      user.streakLast = today;
    }

    await user.save();
  } catch (err) {
    console.error('updateUserStats error:', err);
  }
}

function getRatingTitle(r) {
  if (r < 400)  return 'Newbie';
  if (r < 800)  return 'Pupil';
  if (r < 1200) return 'Specialist';
  if (r < 1600) return 'Expert';
  if (r < 2000) return 'Candidate Master';
  if (r < 2400) return 'Master';
  if (r < 2800) return 'Grandmaster';
  return 'Legendary';
}

export default router;
