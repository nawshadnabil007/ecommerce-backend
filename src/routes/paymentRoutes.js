const express = require('express');
const { body } = require('express-validator');
const PaymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const initiatePaymentValidation = [
  body('orderId').isInt().withMessage('Order ID must be an integer'),
  body('provider').isIn(['stripe', 'bkash']).withMessage('Invalid payment provider')
];

// Get available providers
router.get('/providers', PaymentController.getProviders);

// User routes
router.post('/initiate', auth, initiatePaymentValidation, PaymentController.initiatePayment);
router.post('/confirm', auth, PaymentController.confirmPayment);
router.get('/query/:provider/:transactionId', auth, PaymentController.queryPayment);
router.get('/order/:orderId', auth, PaymentController.getPaymentByOrder);

// Webhook routes (no auth required)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), PaymentController.stripeWebhook);
router.get('/bkash/callback', PaymentController.bkashCallback);

module.exports = router;