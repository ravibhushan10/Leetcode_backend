import express      from 'express';
import crypto       from 'crypto';
import Razorpay     from 'razorpay';
import User         from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── Razorpay instance ─────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Plan config ───────────────────────────────
const PLANS = {
  pro: {
    amount:      29900,   // ₹299 in paise
    currency:    'INR',
    name:        'CodeForge Pro',
    description: 'Monthly Pro — unlimited problems, AI tutor, priority support',
  },
};

// ─────────────────────────────────────────────
//  POST /api/payments/order
//  Creates a Razorpay order. Frontend calls this
//  first, then opens the Razorpay checkout popup.
// ─────────────────────────────────────────────
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const { plan = 'pro' } = req.body;

    const planConfig = PLANS[plan];
    if (!planConfig) return res.status(400).json({ error: 'Invalid plan' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.plan === 'pro') return res.status(400).json({ error: 'Already on Pro plan' });

    const order = await razorpay.orders.create({
      amount:   planConfig.amount,
      currency: planConfig.currency,
      receipt:  `cf_${req.user.id}_${Date.now()}`,
      notes: {
        userId:    req.user.id.toString(),
        plan,
        userEmail: user.email,
      },
    });

    res.json({
      orderId:     order.id,
      amount:      order.amount,
      currency:    order.currency,
      keyId:       process.env.RAZORPAY_KEY_ID,
      name:        planConfig.name,
      description: planConfig.description,
      userEmail:   user.email,
      userName:    user.name,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/payments/verify
//  Called by frontend after Razorpay popup
//  succeeds. Verifies HMAC signature then
//  upgrades the user to Pro.
// ─────────────────────────────────────────────
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan = 'pro',
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    // ── HMAC-SHA256 signature check ───────────
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.warn('⚠️  Signature mismatch for user', req.user.id);
      return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
    }

    // ── Upgrade user ──────────────────────────
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        plan:          plan,
        proSince:      new Date(),
        lastPaymentId: razorpay_payment_id,
        lastOrderId:   razorpay_order_id,
      },
      { new: true }
    ).select('-passwordHash -oauthId');

    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log(`✅ Payment verified — ${user.email} upgraded to ${plan}`);
    res.json({ success: true, plan: user.plan, user });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/payments/webhook
//  Razorpay calls this server-to-server.
//  Register URL in Razorpay Dashboard → Webhooks.
//
//  Uses express.raw() so we get the raw Buffer
//  needed for HMAC signature verification.
//  Must be mounted BEFORE express.json() globally
//  — handled in server.js with rawBodySaver.
// ─────────────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!secret || !signature) {
      return res.status(400).json({ error: 'Missing webhook secret or signature' });
    }

    // ── Verify webhook signature ──────────────
    const expected = crypto
      .createHmac('sha256', secret)
      .update(req.body)           // raw Buffer — NOT parsed JSON
      .digest('hex');

    if (expected !== signature) {
      console.warn('⚠️  Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event   = JSON.parse(req.body.toString());
    const payload = event.payload;

    console.log(`📬 Webhook: ${event.event}`);

    switch (event.event) {

      // ── payment.authorized / payment.captured ──
      case 'payment.authorized':
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;
        const userId = payment.notes?.userId;
        const plan   = payment.notes?.plan || 'pro';
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            plan,
            proSince:      new Date(),
            lastPaymentId: payment.id,
          });
          console.log(`✅ ${event.event} → user ${userId} is now ${plan}`);
        }
        break;
      }

      // ── payment.failed ──
      case 'payment.failed': {
        const payment = payload.payment?.entity;
        console.warn(`❌ payment.failed — id: ${payment?.id}, reason: ${payment?.error_description}`);
        // user never charged — no downgrade needed
        break;
      }

      // ── subscription.activated / subscription.charged ──
      case 'subscription.activated':
      case 'subscription.charged': {
        const sub    = payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { plan: 'pro', proSince: new Date() });
          console.log(`✅ ${event.event} → user ${userId} Pro kept`);
        }
        break;
      }

      // ── subscription.halted ──
      case 'subscription.halted': {
        // repeated payment failures — log but don't cut off immediately
        const sub = payload.subscription?.entity;
        console.warn(`⚠️  subscription.halted — id: ${sub?.id}`);
        break;
      }

      // ── subscription.cancelled / completed ──
      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub    = payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { plan: 'free' });
          console.log(`🔽 ${event.event} → user ${userId} downgraded to free`);
        }
        break;
      }

      // ── subscription.paused ──
      case 'subscription.paused': {
        const sub    = payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { plan: 'free' });
          console.log(`⏸️  subscription.paused → user ${userId} → free`);
        }
        break;
      }

      // ── subscription.resumed ──
      case 'subscription.resumed': {
        const sub    = payload.subscription?.entity;
        const userId = sub?.notes?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { plan: 'pro' });
          console.log(`▶️  subscription.resumed → user ${userId} → pro`);
        }
        break;
      }

      // ── refund.processed ──
      case 'refund.processed': {
        const refund    = payload.refund?.entity;
        const paymentId = refund?.payment_id;
        if (paymentId) {
          const user = await User.findOneAndUpdate(
            { lastPaymentId: paymentId },
            { plan: 'free' },
            { new: true }
          );
          if (user) console.log(`💸 refund.processed → user ${user.email} → free`);
        }
        break;
      }

      // ── refund.failed ──
      case 'refund.failed': {
        const refund = payload.refund?.entity;
        console.warn(`❌ refund.failed — id: ${refund?.id}`);
        break;
      }

      // ── order.paid ──
      case 'order.paid': {
        const order  = payload.order?.entity;
        const userId = order?.notes?.userId;
        const plan   = order?.notes?.plan || 'pro';
        if (userId) {
          await User.findByIdAndUpdate(userId, { plan, proSince: new Date() });
          console.log(`✅ order.paid → user ${userId} → ${plan}`);
        }
        break;
      }

      default:
        console.log(`ℹ️  Unhandled webhook event: ${event.event}`);
    }

    // Always 200 so Razorpay doesn't retry
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─────────────────────────────────────────────
//  GET /api/payments/status
//  Frontend polls this to confirm Pro status
//  after payment completes.
// ─────────────────────────────────────────────
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('plan proSince lastPaymentId');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      plan:          user.plan,
      isPro:         user.plan === 'pro',
      proSince:      user.proSince,
      lastPaymentId: user.lastPaymentId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
