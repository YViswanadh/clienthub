import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Invoice route health check passed' });
});

// Stripe webhook receiver placeholder. Will be mounted on /api/webhooks/stripe in server.js
router.post('/', (req, res) => {
  res.json({ success: true, received: true, message: 'Stripe webhook endpoint placeholder' });
});

export default router;
