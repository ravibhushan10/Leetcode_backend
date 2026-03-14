import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import problemsRouter    from './routes/problems.js';
import usersRouter       from './routes/users.js';
import submissionsRouter from './routes/submissions.js';
import aiRouter          from './routes/ai.js';
import paymentsRouter    from './routes/payments.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL    || 'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
];

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

// ── Razorpay webhook — must be raw body, BEFORE express.json() ───────────
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.options('*', cors(corsOptions)); // preflight
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────

app.get('/', (_, res) => res.json({
  name:    'CodeForge API',
  version: '1.0.0',
  status:  'running',
  time:    new Date(),
  endpoints: [
    'GET  /health',
    'GET  /api/problems',
    'POST /api/users',
    'POST /api/submissions',
    'POST /api/ai',
    'POST /api/payments/order',
    'POST /api/payments/verify',
    'POST /api/payments/webhook',
    'GET  /api/payments/status',
  ],
}));

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api/problems',    problemsRouter);
app.use('/api/users',       usersRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/ai',          aiRouter);
app.use('/api/payments',    paymentsRouter);

// ── MongoDB Connect ───────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 CodeForge API → http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

export default app;
