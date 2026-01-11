const express = require('express');
const { body } = require('express-validator');
const OrderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();

// Validation rules
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// User routes
router.post('/', auth, createOrderValidation, OrderController.createOrder);
router.get('/my-orders', auth, OrderController.getUserOrders);
router.get('/:orderId', auth, OrderController.getOrder);
router.patch('/:orderId/cancel', auth, OrderController.cancelOrder);

// Admin routes
router.get('/admin/all', auth, admin, OrderController.getAllOrders);

module.exports = router;