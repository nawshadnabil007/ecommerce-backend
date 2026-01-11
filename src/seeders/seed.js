require('dotenv').config();
const { sequelize } = require('../config/database');
const { syncDatabase, User, Category, Product } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database
    await syncDatabase();

    // Create Admin User
    console.log('Creating admin user...');
    const admin = await User.model.findOne({ where: { email: 'admin@ecommerce.com' } });
    
    if (!admin) {
      await User.createUser({
        email: 'admin@ecommerce.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
      console.log('✅ Admin user created (email: admin@ecommerce.com, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create Test User
    console.log('Creating test user...');
    const testUser = await User.model.findOne({ where: { email: 'user@test.com' } });
    
    if (!testUser) {
      await User.createUser({
        email: 'user@test.com',
        password: 'user123',
        name: 'Test User',
        role: 'user'
      });
      console.log('✅ Test user created (email: user@test.com, password: user123)');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Create Categories
    console.log('Creating categories...');
    
    const electronicsCategory = await Category.model.findOne({ where: { slug: 'electronics' } });
    let electronics;
    
    if (!electronicsCategory) {
      electronics = await Category.createCategory({
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets'
      });
      console.log('✅ Electronics category created');
    } else {
      electronics = electronicsCategory;
      console.log('ℹ️  Electronics category already exists');
    }

    // Create subcategories
    const mobilesCategory = await Category.model.findOne({ where: { slug: 'mobiles' } });
    
    if (!mobilesCategory) {
      await Category.createCategory({
        name: 'Mobiles',
        slug: 'mobiles',
        description: 'Mobile phones and smartphones',
        parent_id: electronics.id
      });
      console.log('✅ Mobiles subcategory created');
    }

    const laptopsCategory = await Category.model.findOne({ where: { slug: 'laptops' } });
    
    if (!laptopsCategory) {
      await Category.createCategory({
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptop computers',
        parent_id: electronics.id
      });
      console.log('✅ Laptops subcategory created');
    }

    // Create Sample Products
    console.log('Creating sample products...');

    const products = [
      {
        name: 'iPhone 15 Pro',
        sku: 'IPH15PRO',
        description: 'Latest Apple iPhone with A17 Pro chip',
        price: 999.99,
        stock: 50,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'Samsung Galaxy S24',
        sku: 'SAMS24',
        description: 'Samsung flagship smartphone',
        price: 899.99,
        stock: 40,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'MacBook Pro M3',
        sku: 'MBPM3',
        description: '14-inch MacBook Pro with M3 chip',
        price: 1999.99,
        stock: 30,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'Dell XPS 15',
        sku: 'DELLXPS15',
        description: 'High-performance Windows laptop',
        price: 1499.99,
        stock: 25,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'Sony WH-1000XM5',
        sku: 'SONYWH1000',
        description: 'Premium noise-cancelling headphones',
        price: 349.99,
        stock: 60,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'iPad Air M2',
        sku: 'IPADAIRM2',
        description: 'Apple iPad Air with M2 chip',
        price: 599.99,
        stock: 45,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'AirPods Pro',
        sku: 'AIRPODSPRO',
        description: 'Active Noise Cancellation wireless earbuds',
        price: 249.99,
        stock: 100,
        status: 'active',
        category_id: electronics.id
      },
      {
        name: 'Apple Watch Series 9',
        sku: 'APWATCHS9',
        description: 'Advanced health and fitness smartwatch',
        price: 399.99,
        stock: 55,
        status: 'active',
        category_id: electronics.id
      }
    ];

    for (const productData of products) {
      const existingProduct = await Product.model.findOne({ 
        where: { sku: productData.sku } 
      });

      if (!existingProduct) {
        await Product.createProduct(productData);
        console.log(`✅ Product created: ${productData.name}`);
      } else {
        console.log(`ℹ️  Product already exists: ${productData.name}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@ecommerce.com / admin123');
    console.log('User: user@test.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();