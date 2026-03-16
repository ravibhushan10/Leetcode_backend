import express from 'express';
import fetch from 'node-fetch';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/hint
router.post('/hint', authMiddleware, async (req, res) => {
  try {
    const { message, problemContext, history = [] } = req.body;
    const key = process.env.GROQ_API_KEY;

    if (!key || key === 'your_groq_api_key_here') {
      return res.json({ reply: getFallback(message, problemContext) });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are CodeForge AI Tutor. Problem: "${problemContext}".
Give hints NOT full solutions unless asked. Be concise (2-3 sentences). Be encouraging.`,
          },
          ...history.slice(-6),
          { role: 'user', content: message },
        ],
        max_tokens: 256, temperature: 0.7,
      }),
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || getFallback(message, problemContext) });
  } catch (err) {
    res.json({ reply: getFallback(req.body.message, req.body.problemContext) });
  }
});

function getFallback(msg, ctx) {
  const lower = (msg || '').toLowerCase();
  if (lower.includes('hint') || lower.includes('stuck')) return ` Think about what data structure lets you look up values in O(1). For "${ctx}", try breaking it into smaller subproblems.`;
  if (lower.includes('complex')) return `For "${ctx}", aim for O(n) time. A single pass with a hash map usually does it.`;
  if (lower.includes('approach')) return `Start with a brute force O(n²) approach first, then optimize using a smarter data structure.`;
  return `Great question! For "${ctx}", try working through a small example by hand — the pattern usually becomes obvious.`;
}

export default router;
