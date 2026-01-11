const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class OrderItem {
  static model = sequelize.define('OrderItem', {
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    timestamps: true,
    tableName: 'order_items',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] }
    ]
  });

  // Algorithm: Calculate subtotal
  static calculateSubtotal(price, quantity) {
    return (parseFloat(price) * quantity).toFixed(2);
  }

  static async getOrderItems(orderId) {
    return await this.model.findAll({
      where: { order_id: orderId }
    });
  }
}

module.exports = OrderItem;