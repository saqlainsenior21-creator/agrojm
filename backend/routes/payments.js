const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const axios = require('axios');

// WiPay payment initiation (JMD card payments)
router.post('/initiate', auth, requireRole('buyer'), async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ error: 'order_id required' });

  const order = db.prepare('SELECT * FROM orders WHERE id=? AND buyer_id=?').get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

  const WIPAY_ACCOUNT = process.env.WIPAY_ACCOUNT_NUMBER;
  const WIPAY_API_KEY = process.env.WIPAY_API_KEY;

  if (!WIPAY_ACCOUNT || !WIPAY_API_KEY) {
    // Return mock payment URL in dev mode
    return res.json({
      payment_url: `https://sandbox.wipayfinancial.com/pay/mock?order=${order_id}&amount=${order.total_amount}`,
      mock: true,
      message: 'WiPay not configured — using mock payment'
    });
  }

  try {
    const payload = {
      account_number: WIPAY_ACCOUNT,
      avs: '0',
      data: order_id,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
      fee_structure: 'absorb',
      method: 'credit_card',
      order_id,
      origin: process.env.FRONTEND_URL || 'https://agrojm.com',
      response_url: `${process.env.FRONTEND_URL || 'https://agrojm.com'}/payment/callback`,
      total: order.total_amount,
    };

    const { data } = await axios.post('https://wipayfinancial.com/plugins/payment/request',
      payload, { headers: { Authorization: `Bearer ${WIPAY_API_KEY}` } });

    if (data.status === 200) {
      res.json({ payment_url: data.url });
    } else {
      res.status(500).json({ error: 'Payment initiation failed', detail: data });
    }
  } catch (e) {
    res.status(500).json({ error: 'Payment service error', message: e.message });
  }
});

// WiPay callback — WiPay posts here after payment
router.post('/callback', async (req, res) => {
  const { order_id, status, transaction_id } = req.body;
  if (!order_id) return res.status(400).json({ error: 'Invalid callback' });

  if (status === 'success' || status === '0') {
    db.prepare("UPDATE orders SET payment_status='paid', payment_ref=?, status='paid', updated_at=datetime('now') WHERE id=?")
      .run(transaction_id || uuidv4(), order_id);
    // Reduce listing quantity
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(order_id);
    if (order) {
      db.prepare('UPDATE listings SET quantity_available = quantity_available - ? WHERE id=?')
        .run(order.quantity, order.listing_id);
    }
  }
  res.json({ received: true });
});

// GET /api/payments/status/:order_id
router.get('/status/:order_id', auth, (req, res) => {
  const order = db.prepare('SELECT id, payment_status, payment_ref, total_amount, status FROM orders WHERE id=?').get(req.params.order_id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
