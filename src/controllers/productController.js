const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');

class ProductController {
  // Get all products
  static async getAllProducts(req, res, next) {
    try {
      const { status, category_id } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (category_id) filters.category_id = category_id;

      const products = await Product.getAllProducts(filters);

      res.json({
        success: true,
        count: products.length,
        data: { products }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  static async getProduct(req, res, next) {
    try {
      const product = await Product.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create product (Admin only)
  static async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const product = await Product.createProduct(req.body);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product (Admin only)
  static async updateProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const product = await Product.updateProduct(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product (Admin only)
  static async deleteProduct(req, res, next) {
    try {
      await Product.deleteProduct(req.params.id);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get products by category (with DFS for subcategories)
  static async getProductsByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Get products from this category and all subcategories using DFS
      const products = await Product.getProductsByCategoryDFS(categoryId);

      res.json({
        success: true,
        count: products.length,
        data: {
          category: category.name,
          products
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;