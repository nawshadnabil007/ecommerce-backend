const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentStrategy = require('./PaymentStrategy');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

class StripeStrategy extends PaymentStrategy {
  constructor() {
    super();
    this.providerName = 'stripe';
  }

  // Create payment intent
  async createPayment(order, paymentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(order.total_amount) * 100), // Convert to cents
        currency: paymentData.currency || 'usd',
        metadata: {
          order_id: order.id,
          user_id: order.user_id
        }
      });

      // Store payment record
      const payment = await Payment.createPayment({
        order_id: order.id,
        provider: 'stripe',
        transaction_id: paymentIntent.id,
        status: 'pending',
        amount: order.total_amount,
        raw_response: paymentIntent
      });

      return {
        success: true,
        paymentIntent,
        payment,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  // Confirm payment
  async confirmPayment(transactionId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status
        const payment = await Payment.updatePaymentStatus(
          transactionId,
          'success',
          paymentIntent
        );

        // Update order status
        await Order.updateOrderStatus(payment.order_id, 'paid');

        // Reduce stock
        const orderItems = await OrderItem.getOrderItems(payment.order_id);
        for (const item of orderItems) {
          await Product.reduceStock(item.product_id, item.quantity);
        }

        return {
          success: true,
          status: 'success',
          payment
        };
      }

      return {
        success: false,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Stripe confirmation error:', error);
      throw new Error(`Stripe confirmation failed: ${error.message}`);
    }
  }

  // Handle webhook
  async handleWebhook(payload, signature) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        await this.confirmPayment(paymentIntent.id);
      }

      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const payment = await Payment.updatePaymentStatus(
          paymentIntent.id,
          'failed',
          paymentIntent
        );
        await Order.updateOrderStatus(payment.order_id, 'failed');
      }

      return { success: true, event };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  // Query payment status
  async queryPayment(transactionId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      return {
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentIntent
      };
    } catch (error) {
      console.error('Stripe query error:', error);
      throw new Error(`Payment query failed: ${error.message}`);
    }
  }
}

module.exports = StripeStrategy;