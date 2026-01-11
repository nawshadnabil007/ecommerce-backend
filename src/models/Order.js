const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Order {
  static model = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'canceled', 'failed'),
      defaultValue: 'pending'
    }
  }, {
    timestamps: true,
    tableName: 'orders',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] }
    ]
  });

  // Algorithm: Calculate order total from order items
  static async calculateOrderTotal(orderId) {
    const OrderItem = require('./OrderItem');
    
    const orderItems = await OrderItem.model.findAll({
      where: { order_id: orderId }
    });

    let total = 0;
    for (const item of orderItems) {
      total += parseFloat(item.subtotal);
    }

    return total.toFixed(2);
  }

  // Create order with items
  static async createOrder(userId, items) {
    const Product = require('./Product');
    const OrderItem = require('./OrderItem');

    // Create order
    const order = await this.model.create({
      user_id: userId,
      total_amount: 0,
      status: 'pending'
    });

    // Create order items and calculate total
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.getProductById(item.product_id);
      
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const subtotal = parseFloat(product.price) * item.quantity;
      
      await OrderItem.model.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
        subtotal: subtotal
      });

      totalAmount += subtotal;
    }

    // Update order total
    order.total_amount = totalAmount.toFixed(2);
    await order.save();

    return order;
  }

  static async updateOrderStatus(orderId, status) {
    const order = await this.model.findByPk(orderId);
    if (!order) throw new Error('Order not found');
    
    order.status = status;
    await order.save();
    
    return order;
  }

  static async getOrderById(orderId) {
    return await this.model.findByPk(orderId);
  }

  static async getUserOrders(userId) {
    return await this.model.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = Order;