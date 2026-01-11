const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Product {
  static model = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'products',
    indexes: [
      { fields: ['sku'] },
      { fields: ['status'] },
      { fields: ['category_id'] }
    ]
  });

  // Safely reduce stock after payment (Algorithm requirement)
  static async reduceStock(productId, quantity) {
    const product = await this.model.findByPk(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    product.stock -= quantity;
    await product.save();

    return product;
  }

  // Restore stock if payment fails
  static async restoreStock(productId, quantity) {
    const product = await this.model.findByPk(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    product.stock += quantity;
    await product.save();

    return product;
  }

  static async createProduct(data) {
    return await this.model.create(data);
  }

  static async updateProduct(id, data) {
    const product = await this.model.findByPk(id);
    if (!product) throw new Error('Product not found');
    return await product.update(data);
  }

  static async deleteProduct(id) {
    const product = await this.model.findByPk(id);
    if (!product) throw new Error('Product not found');
    return await product.destroy();
  }

  static async getAllProducts(filters = {}) {
    const where = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.category_id) where.category_id = filters.category_id;

    return await this.model.findAll({ where });
  }

  static async getProductById(id) {
    return await this.model.findByPk(id);
  }

  static async getProductsByCategoryDFS(categoryId) {
    const Category = require('./Category');
    
    // Get all subcategories using DFS
    const subcategories = await Category.getSubcategoriesDFS(categoryId);
    const categoryIds = [categoryId, ...subcategories.map(c => c.id)];

    // Get all products in these categories
    return await this.model.findAll({
      where: {
        category_id: categoryIds,
        status: 'active'
      }
    });
  }
}

module.exports = Product;