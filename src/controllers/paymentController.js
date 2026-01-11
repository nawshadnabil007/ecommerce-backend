const { validationResult } = require('express-validator');
const paymentContext = require('../strategies/PaymentContext');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

class PaymentController {
  // Initiate payment (Checkout)
  static async initiatePayment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { orderId, provider, paymentData = {} } = req.body;
      const userId = req.user.id;

      // Validate provider
      const availableProviders = paymentContext.getAvailableProviders();
      if (!availableProviders.includes(provider.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment provider. Available: ${availableProviders.join(', ')}`
        });
      }

      // Get order
      const order = await Order.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order belongs to user
      if (order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if order is pending
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot process payment for order with status: ${order.status}`
        });
      }

      // Check if payment already exists
      const existingPayment = await Payment.getPaymentByOrderId(orderId);
      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment already initiated for this order',
          data: { payment: existingPayment }
        });
      }

      // Set payment strategy based on provider
      paymentContext.setStrategy(provider);

      // Create payment using the selected strategy
      const result = await paymentContext.createPayment(order, paymentData);

      res.status(201).json({
        success: true,
        message: `Payment initiated via ${provider}`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Confirm/Execute payment
  static async confirmPayment(req, res, next) {
    try {
      const { transactionId, provider } = req.body;

      if (!transactionId || !provider) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID and provider are required'
        });
      }

      // Set payment strategy
      paymentContext.setStrategy(provider);

      // Confirm payment
      const result = await paymentContext.confirmPayment(transactionId);

      res.json({
        success: true,
        message: 'Payment confirmed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Query payment status
  static async queryPayment(req, res, next) {
    try {
      const { transactionId, provider } = req.params;

      // Set payment strategy
      paymentContext.setStrategy(provider);

      // Query payment
      const result = await paymentContext.queryPayment(transactionId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get payment by order
  static async getPaymentByOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      // Get order
      const order = await Order.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order belongs to user (unless admin)
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const payment = await Payment.getPaymentByOrderId(orderId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found for this order'
        });
      }

      res.json({
        success: true,
        data: { payment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Stripe webhook handler
  static async stripeWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      paymentContext.setStrategy('stripe');
      const result = await paymentContext.handleWebhook(payload, signature);

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }

  // bKash callback handler
  static async bkashCallback(req, res, next) {
    try {
      const { paymentID, status } = req.query;

      if (status === 'success' && paymentID) {
        // Execute payment
        paymentContext.setStrategy('bkash');
        await paymentContext.confirmPayment(paymentID);

        res.send('<h1>Payment Successful!</h1><p>Your order has been confirmed.</p>');
      } else {
        res.send('<h1>Payment Failed!</h1><p>Please try again.</p>');
      }
    } catch (error) {
      console.error('bKash callback error:', error);
      res.status(500).send('<h1>Error processing payment</h1>');
    }
  }

  // Get available payment providers
  static getProviders(req, res) {
    const providers = paymentContext.getAvailableProviders();
    res.json({
      success: true,
      data: { providers }
    });
  }
}

module.exports = PaymentController;