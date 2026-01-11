const express = require('express');
const { body } = require('express-validator');
const CategoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Slug is required')
];

// Public routes
router.get('/', CategoryController.getAllCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/:id', CategoryController.getCategory);
router.get('/:categoryId/subcategories', CategoryController.getSubcategories);

// Admin routes
router.post('/', auth, admin, categoryValidation, CategoryController.createCategory);

module.exports = router;