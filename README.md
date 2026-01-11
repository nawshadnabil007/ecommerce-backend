# 🛒 E-commerce Backend System

A comprehensive backend system for managing users, products, orders, and payments with support for multiple payment providers (Stripe & bKash).

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Design Patterns](#design-patterns)
- [Payment Flow](#payment-flow)
- [Deployment](#deployment)

## ✨ Features

- **User Management**: Registration, login with JWT authentication
- **Product Management**: CRUD operations with admin authorization
- **Category Hierarchy**: Tree structure with DFS traversal
- **Order Management**: Create orders with multiple products
- **Payment Integration**: Support for Stripe and bKash
- **Strategy Pattern**: Easily add new payment providers
- **Redis Caching**: Category tree caching for performance
- **Stock Management**: Automatic stock reduction after payment
- **Webhooks**: Handle payment confirmations
- **Role-based Access**: Admin and user roles

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Caching**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Payment Gateways**: Stripe, bKash
- **Testing**: Jest, Supertest
- **Deployment**: Docker, ngrok

## 📦 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- Docker & Docker Compose (optional)
- Stripe Account (for testing)
- bKash Merchant Account (for testing)

## 💻 Installation

### Option 1: Local Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ecommerce-backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Update .env with your credentials

# 5. Create database
createdb ecommerce_db

# 6. Run seeders
node src/seeders/seed.js

# 7. Start the server
npm run dev
```

### Option 2: Docker Setup

```bash
# 1. Clone and navigate
git clone <your-repo-url>
cd ecommerce-backend

# 2. Create .env file
cp .env.example .env

# 3. Update .env with your credentials

# 4. Start all services
docker-compose up -d

# 5. Run seeders
docker-compose exec app node src/seeders/seed.js
```

## ⚙️ Configuration

Update `.env` file with credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# bKash
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_app_key
BKASH_APP_SECRET=your_app_secret
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🏃 Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests with coverage
npm run test
```

## 📡 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Products

#### Get All Products
```http
GET /api/products
GET /api/products?status=active
GET /api/products?category_id=1
```

#### Get Single Product
```http
GET /api/products/:id
```

#### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Product Name",
  "sku": "PROD001",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "status": "active",
  "category_id": 1
}
```

#### Update Product (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 89.99,
  "stock": 150
}
```

#### Delete Product (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

### Categories

#### Get All Categories
```http
GET /api/categories
```

#### Get Category Tree (Cached with Redis)
```http
GET /api/categories/tree
```

#### Get Subcategories (DFS)
```http
GET /api/categories/:categoryId/subcategories
```

#### Create Category (Admin)
```http
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic items",
  "parent_id": null
}
```

### Orders

#### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

#### Get My Orders
```http
GET /api/orders/my-orders
Authorization: Bearer <token>
```

#### Get Single Order
```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

#### Cancel Order
```http
PATCH /api/orders/:orderId/cancel
Authorization: Bearer <token>
```

#### Get All Orders (Admin)
```http
GET /api/orders/admin/all
Authorization: Bearer <admin_token>
```

### Payments

#### Get Available Providers
```http
GET /api/payment/providers
```

#### Initiate Payment
```http
POST /api/payment/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": 1,
  "provider": "stripe",
  "paymentData": {
    "currency": "usd"
  }
}
```

#### Confirm Payment
```http
POST /api/payment/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionId": "pi_xxxxx",
  "provider": "stripe"
}
```

#### Query Payment Status
```http
GET /api/payment/query/:provider/:transactionId
Authorization: Bearer <token>
```

#### Get Payment by Order
```http
GET /api/payment/order/:orderId
Authorization: Bearer <token>
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test
```

Test files are located in the `tests/` directory.

## 🎨 Design Patterns

### Strategy Pattern (Payment System)

The payment system uses the Strategy Pattern to switch between different payment providers without modifying core logic.

**Structure:**
- `PaymentStrategy` (Abstract base class)
- `StripeStrategy` (Concrete strategy)
- `BkashStrategy` (Concrete strategy)
- `PaymentContext` (Context class)

**Usage:**
```javascript
const paymentContext = require('./strategies/PaymentContext');

// Switch to Stripe
paymentContext.setStrategy('stripe');
await paymentContext.createPayment(order, data);

// Switch to bKash
paymentContext.setStrategy('bkash');
await paymentContext.createPayment(order, data);
```

### DFS Algorithm (Category Hierarchy)

Depth-First Search is used to traverse category trees and get all subcategories recursively.

```javascript
// Get all products in a category and its subcategories
const products = await Product.getProductsByCategoryDFS(categoryId);
```

### Redis Caching

Category tree is cached in Redis to minimize database calls:

```javascript
// Automatically cached for 1 hour
const categoryTree = await Category.getCategoryTree();
```

## 💳 Payment Flow

### Stripe Flow

1. User creates order
2. User initiates Stripe payment
3. Frontend receives `clientSecret`
4. Frontend completes payment with Stripe.js
5. Webhook confirms payment
6. Order status updated to 'paid'
7. Stock reduced automatically

### bKash Flow

1. User creates order
2. User initiates bKash payment
3. User redirected to bKash payment page
4. User completes payment on bKash
5. bKash redirects to callback URL
6. Backend executes payment
7. Order status updated to 'paid'
8. Stock reduced automatically

## 🚀 Deployment

### Local with ngrok

```bash
# Start the server
npm run dev

# In another terminal, start ngrok
ngrok http 5000

# Update webhook URLs in Stripe dashboard
```

### Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

### Environment Variables for Production

Make sure to update these for production:
- Use strong `JWT_SECRET`
- Use live Stripe keys
- Use production bKash credentials
- Set proper `FRONTEND_URL` for CORS

## 📊 Database Schema (ERD)

```
Users (1) ----< (N) Orders
Orders (1) ----< (N) OrderItems
OrderItems (N) >---- (1) Products
Orders (1) ---- (1) Payments
Products (N) >---- (1) Categories
Categories (self-referential) - parent/child relationship
```

## 👥 Default Users

After running seeders:

- **Admin**: admin@ecommerce.com / admin123
- **User**: user@test.com / user123


## 🤝 Support

For issues or questions, please create an issue in the repository.

---
