import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import mongoose from 'mongoose';

import problemsRouter    from './routes/problems.js';
import usersRouter       from './routes/users.js';
import submissionsRouter from './routes/submissions.js';
import aiRouter          from './routes/ai.js';
import paymentsRouter    from './routes/payments.js';
import User    from './models/User.js';
import Problem from './models/Problem.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('file://') ||
      origin === process.env.FRONTEND_URL ||
      origin === process.env.ADMIN_URL
    ) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ── Razorpay webhook MUST get raw body — mount BEFORE express.json() ──
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────
app.get('/', (_, res) => res.json({ name: 'CodeForge API', version: '1.0.0', status: 'running', time: new Date() }));
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/problems',    problemsRouter);
app.use('/api/users',       usersRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/ai',          aiRouter);
app.use('/api/payments',    paymentsRouter);

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// ── MongoDB Connect ───────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    try {
      await User.syncIndexes();
      await Problem.syncIndexes();
      console.log('✅ Indexes synced');
    } catch (e) {
      console.warn('⚠️  Index sync warning (run npm run seed to fix):', e.message);
    }
    app.listen(PORT, () => console.log(`🚀 CodeForge API → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

export default app;
