const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Payment {
  static model = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    provider: {
      type: DataTypes.ENUM('stripe', 'bkash'),
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    raw_response: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'payments',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['transaction_id'] },
      { fields: ['provider'] },
      { fields: ['status'] }
    ]
  });

  static async createPayment(data) {
    return await this.model.create(data);
  }

  static async updatePaymentStatus(transactionId, status, rawResponse = null) {
    const payment = await this.model.findOne({
      where: { transaction_id: transactionId }
    });

    if (!payment) throw new Error('Payment not found');

    payment.status = status;
    if (rawResponse) {
      payment.raw_response = rawResponse;
    }
    await payment.save();

    return payment;
  }

  static async getPaymentByOrderId(orderId) {
    return await this.model.findOne({
      where: { order_id: orderId }
    });
  }

  static async getPaymentByTransactionId(transactionId) {
    return await this.model.findOne({
      where: { transaction_id: transactionId }
    });
  }
}

module.exports = Payment;