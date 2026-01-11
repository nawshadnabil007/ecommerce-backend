const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

class OrderController {
  // Create new order
  static async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { items } = req.body;
      const userId = req.user.id;

      // Validate items array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order must contain at least one item'
        });
      }

      // Create order with items
      const order = await Order.createOrder(userId, items);

      // Get order with items
      const orderWithItems = await Order.model.findByPk(order.id, {
        include: [
          {
            model: OrderItem.model,
            as: 'items',
            include: [{
              model: Product.model,
              as: 'product'
            }]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { order: orderWithItems }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's orders
  static async getUserOrders(req, res, next) {
    try {
      const userId = req.user.id;

      const orders = await Order.model.findAll({
        where: { user_id: userId },
        include: [
          {
            model: OrderItem.model,
            as: 'items',
            include: [{
              model: Product.model,
              as: 'product'
            }]
          },
          {
            model: Payment.model,
            as: 'payment'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        count: orders.length,
        data: { orders }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single order
  static async getOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.model.findOne({
        where: { id: orderId },
        include: [
          {
            model: OrderItem.model,
            as: 'items',
            include: [{
              model: Product.model,
              as: 'product'
            }]
          },
          {
            model: Payment.model,
            as: 'payment'
          }
        ]
      });

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

      res.json({
        success: true,
        data: { order }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  static async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order belongs to user
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Can only cancel pending orders
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status: ${order.status}`
        });
      }

      await Order.updateOrderStatus(orderId, 'canceled');

      res.json({
        success: true,
        message: 'Order canceled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all orders (Admin only)
  static async getAllOrders(req, res, next) {
    try {
      const orders = await Order.model.findAll({
        include: [
          {
            model: OrderItem.model,
            as: 'items',
            include: [{
              model: Product.model,
              as: 'product'
            }]
          },
          {
            model: Payment.model,
            as: 'payment'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        count: orders.length,
        data: { orders }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;