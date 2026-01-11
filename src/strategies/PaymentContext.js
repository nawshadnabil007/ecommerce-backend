const StripeStrategy = require('./StripeStrategy');
const BkashStrategy = require('./BkashStrategy');

// Context class that uses Payment Strategy
class PaymentContext {
  constructor() {
    this.strategy = null;
    this.strategies = {
      stripe: new StripeStrategy(),
      bkash: new BkashStrategy()
    };
  }

  // Set payment strategy dynamically
  setStrategy(providerName) {
    const provider = providerName.toLowerCase();
    
    if (!this.strategies[provider]) {
      throw new Error(`Payment provider '${providerName}' is not supported`);
    }

    this.strategy = this.strategies[provider];
    return this;
  }

  // Get available providers
  getAvailableProviders() {
    return Object.keys(this.strategies);
  }

  // Create payment using selected strategy
  async createPayment(order, paymentData) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set. Call setStrategy() first.');
    }

    return await this.strategy.createPayment(order, paymentData);
  }

  // Confirm payment using selected strategy
  async confirmPayment(transactionId) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set. Call setStrategy() first.');
    }

    return await this.strategy.confirmPayment(transactionId);
  }

  // Handle webhook using selected strategy
  async handleWebhook(payload, signature = null) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set. Call setStrategy() first.');
    }

    return await this.strategy.handleWebhook(payload, signature);
  }

  // Query payment using selected strategy
  async queryPayment(transactionId) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set. Call setStrategy() first.');
    }

    return await this.strategy.queryPayment(transactionId);
  }

  // Get current strategy name
  getCurrentProvider() {
    return this.strategy ? this.strategy.getProviderName() : null;
  }

  // Add new payment strategy dynamically (for future providers)
  addStrategy(providerName, strategyInstance) {
    this.strategies[providerName.toLowerCase()] = strategyInstance;
  }
}

// Export singleton instance
module.exports = new PaymentContext();