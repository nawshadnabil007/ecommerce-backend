const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');

// Define relationships

// User - Order: One to Many
User.model.hasMany(Order.model, { foreignKey: 'user_id', as: 'orders' });
Order.model.belongsTo(User.model, { foreignKey: 'user_id', as: 'user' });

// Category - Product: One to Many
Category.model.hasMany(Product.model, { foreignKey: 'category_id', as: 'products' });
Product.model.belongsTo(Category.model, { foreignKey: 'category_id', as: 'category' });

// Category - Category: Self-referential (Parent-Child)
Category.model.hasMany(Category.model, { foreignKey: 'parent_id', as: 'children' });
Category.model.belongsTo(Category.model, { foreignKey: 'parent_id', as: 'parent' });

// Order - OrderItem: One to Many
Order.model.hasMany(OrderItem.model, { foreignKey: 'order_id', as: 'items' });
OrderItem.model.belongsTo(Order.model, { foreignKey: 'order_id', as: 'order' });

// Product - OrderItem: One to Many
Product.model.hasMany(OrderItem.model, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.model.belongsTo(Product.model, { foreignKey: 'product_id', as: 'product' });

// Order - Payment: One to One
Order.model.hasOne(Payment.model, { foreignKey: 'order_id', as: 'payment' });
Payment.model.belongsTo(Order.model, { foreignKey: 'order_id', as: 'order' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database sync error:', error);
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Payment
};