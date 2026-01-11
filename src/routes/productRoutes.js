const express = require('express');
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

// Public routes
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProduct);
router.get('/category/:categoryId', ProductController.getProductsByCategory);

// Admin routes
router.post('/', auth, admin, productValidation, ProductController.createProduct);
router.put('/:id', auth, admin, productValidation, ProductController.updateProduct);
router.delete('/:id', auth, admin, ProductController.deleteProduct);

module.exports = router;