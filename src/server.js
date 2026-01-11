require('dotenv').config();
const app = require('./app');
const { testConnection, sequelize } = require('./config/database');
const { syncDatabase } = require('./models');
const { redis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    await syncDatabase();

    // Test Redis connection
    await redis.ping();

    // Start listening
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`💾 Database: Connected`);
      console.log(`🔴 Redis: Connected`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

// Start the server
startServer();