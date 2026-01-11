const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Category {
  static model = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'categories'
  });

  // DFS Algorithm - Get all subcategories recursively
  static async getSubcategoriesDFS(categoryId, visited = new Set()) {
    if (visited.has(categoryId)) return [];
    visited.add(categoryId);

    const subcategories = await this.model.findAll({
      where: { parent_id: categoryId }
    });

    let result = [...subcategories];

    for (const subcat of subcategories) {
      const children = await this.getSubcategoriesDFS(subcat.id, visited);
      result = result.concat(children);
    }

    return result;
  }

  // Get category tree (hierarchical structure)
  static async getCategoryTree(parentId = null) {
    const categories = await this.model.findAll({
      where: { parent_id: parentId }
    });

    const tree = [];
    for (const category of categories) {
      const node = category.toJSON();
      node.children = await this.getCategoryTree(category.id);
      tree.push(node);
    }

    return tree;
  }

  // Get all parent categories up to root
  static async getParentCategories(categoryId) {
    const parents = [];
    let currentId = categoryId;

    while (currentId) {
      const category = await this.model.findByPk(currentId);
      if (!category) break;
      
      parents.unshift(category);
      currentId = category.parent_id;
    }

    return parents;
  }

  static async createCategory(data) {
    return await this.model.create(data);
  }

  static async getAllCategories() {
    return await this.model.findAll();
  }

  static async getCategoryById(id) {
    return await this.model.findByPk(id);
  }
}

module.exports = Category;