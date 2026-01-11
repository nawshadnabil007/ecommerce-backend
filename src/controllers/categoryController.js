const { validationResult } = require('express-validator');
const Category = require('../models/Category');
const { cacheHelper } = require('../config/redis');

class CategoryController {
  // Get all categories
  static async getAllCategories(req, res, next) {
    try {
      const categories = await Category.getAllCategories();

      res.json({
        success: true,
        count: categories.length,
        data: { categories }
      });
    } catch (error) {
      next(error);
    }
  }

// Get category tree (hierarchical) with Redis caching
static async getCategoryTree(req, res, next) {
  try {
    const cacheKey = 'category_tree';

    // Try to get from cache
    let categoryTree = await cacheHelper.get(cacheKey);
    let fromCache = false;

    if (!categoryTree) {
      // If not in cache, fetch from database
      categoryTree = await Category.getCategoryTree();

      // Store in Redis cache for 1 hour
      await cacheHelper.set(cacheKey, categoryTree, 3600);
      fromCache = false;
    } else {
      fromCache = true;
    }

    res.json({
      success: true,
      data: { categoryTree },
      cached: fromCache
    });
  } catch (error) {
    next(error);
  }
}

  // Get subcategories using DFS
  static async getSubcategories(req, res, next) {
    try {
      const { categoryId } = req.params;

      const category = await Category.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Use DFS to get all subcategories
      const subcategories = await Category.getSubcategoriesDFS(parseInt(categoryId));

      res.json({
        success: true,
        count: subcategories.length,
        data: {
          category: category.name,
          subcategories
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single category
  static async getCategory(req, res, next) {
    try {
      const category = await Category.getCategoryById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create category (Admin only)
  static async createCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const category = await Category.createCategory(req.body);

      // Clear category tree cache
      await cacheHelper.del('category_tree');

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;