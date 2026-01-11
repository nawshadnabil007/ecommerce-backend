const axios = require('axios');
const PaymentStrategy = require('./PaymentStrategy');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

class BkashStrategy extends PaymentStrategy {
  constructor() {
    super();
    this.providerName = 'bkash';
    this.baseURL = process.env.BKASH_BASE_URL;
    this.appKey = process.env.BKASH_APP_KEY;
    this.appSecret = process.env.BKASH_APP_SECRET;
    this.username = process.env.BKASH_USERNAME;
    this.password = process.env.BKASH_PASSWORD;
    this.accessToken = null;
  }

  // Get bKash access token
  async getAccessToken() {
    try {
      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/token/grant`,
        {
          app_key: this.appKey,
          app_secret: this.appSecret
        },
        {
          headers: {
            'Content-Type': 'application/json',
            username: this.username,
            password: this.password
          }
        }
      );

      this.accessToken = response.data.id_token;
      return this.accessToken;
    } catch (error) {
      console.error('bKash token error:', error.response?.data || error.message);
      throw new Error('Failed to get bKash access token');
    }
  }

  // Create payment (checkout)
  async createPayment(order, paymentData) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/create`,
        {
          mode: '0011',
          payerReference: `USER_${order.user_id}`,
          callbackURL: paymentData.callbackURL || 'http://localhost:5000/api/payment/bkash/callback',
          amount: order.total_amount.toString(),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: `INV_${order.id}_${Date.now()}`
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: this.accessToken,
            'x-app-key': this.appKey
          }
        }
      );

      const paymentID = response.data.paymentID;

      // Store payment record
      const payment = await Payment.createPayment({
        order_id: order.id,
        provider: 'bkash',
        transaction_id: paymentID,
        status: 'pending',
        amount: order.total_amount,
        raw_response: response.data
      });

      return {
        success: true,
        paymentID,
        bkashURL: response.data.bkashURL,
        payment
      };
    } catch (error) {
      console.error('bKash create payment error:', error.response?.data || error.message);
      throw new Error(`bKash payment creation failed: ${error.message}`);
    }
  }

  // Execute payment
  async confirmPayment(transactionId) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/execute`,
        {
          paymentID: transactionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: this.accessToken,
            'x-app-key': this.appKey
          }
        }
      );

      if (response.data.transactionStatus === 'Completed') {
        // Update payment status
        const payment = await Payment.updatePaymentStatus(
          transactionId,
          'success',
          response.data
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
          payment,
          trxID: response.data.trxID
        };
      }

      return {
        success: false,
        status: response.data.transactionStatus
      };
    } catch (error) {
      console.error('bKash execute payment error:', error.response?.data || error.message);
      
      // If execution fails, mark payment as failed
      try {
        const payment = await Payment.getPaymentByTransactionId(transactionId);
        if (payment) {
          await Payment.updatePaymentStatus(transactionId, 'failed', error.response?.data);
          await Order.updateOrderStatus(payment.order_id, 'failed');
        }
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }

      throw new Error(`bKash payment execution failed: ${error.message}`);
    }
  }

  // Query payment status
  async queryPayment(transactionId) {
    try {
      if (!this.accessToken) {
        await this.getAccessToken();
      }

      const response = await axios.post(
        `${this.baseURL}/tokenized/checkout/payment/status`,
        {
          paymentID: transactionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: this.accessToken,
            'x-app-key': this.appKey
          }
        }
      );

      return {
        success: true,
        status: response.data.transactionStatus,
        amount: response.data.amount,
        trxID: response.data.trxID,
        paymentData: response.data
      };
    } catch (error) {
      console.error('bKash query error:', error.response?.data || error.message);
      throw new Error(`Payment query failed: ${error.message}`);
    }
  }

  // Handle webhook (bKash doesn't have standard webhooks like Stripe)
  async handleWebhook(payload) {
    // bKash uses callback URLs instead of webhooks
    // This method is included for consistency with the PaymentStrategy interface
    return {
      success: true,
      message: 'bKash uses callback URLs instead of webhooks'
    };
  }
}

module.exports = BkashStrategy;