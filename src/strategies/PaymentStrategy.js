// Base Strategy Pattern - Abstract Payment Strategy
class PaymentStrategy {
  constructor() {
    if (this.constructor === PaymentStrategy) {
      throw new Error('Cannot instantiate abstract class PaymentStrategy');
    }
  }

  // Abstract methods that must be implemented by concrete strategies
  async createPayment(order, paymentData) {
    throw new Error('Method createPayment() must be implemented');
  }

  async confirmPayment(transactionId) {
    throw new Error('Method confirmPayment() must be implemented');
  }

  async handleWebhook(payload) {
    throw new Error('Method handleWebhook() must be implemented');
  }

  async queryPayment(transactionId) {
    throw new Error('Method queryPayment() must be implemented');
  }

  // Helper method to get provider name
  getProviderName() {
    return this.providerName;
  }
}

module.exports = PaymentStrategy;