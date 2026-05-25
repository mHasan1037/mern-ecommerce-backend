# 🛒 MERN Ecommerce Backend

A robust REST API powering a full-featured ecommerce platform, built with **Node.js**, **Express.js**, and **MongoDB**. This is the server-side of a MERN stack application with JWT authentication, Cloudinary image management, SSLCommerz payment integration, and AI-powered features via OpenAI.

🎬 [Watch Video Presentation](https://www.youtube.com/watch?v=LNnoBmY9ezc) &nbsp;|&nbsp; 🌐 [Live API](https://mern-ecommerce-frontend-jg1w.onrender.com/)

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)

---

## About the Project

This is the REST API backend of a MERN ecommerce application. It handles user authentication, product management, order processing, payment integration (SSLCommerz), Cloudinary-based image uploads, email notifications via Nodemailer, and AI-powered features using OpenAI. The API is consumed by the [Next.js frontend](https://github.com/mHasan1037/mern-ecommerce-frontend).

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) + Passport.js |
| Password Hashing | bcryptjs |
| Image Hosting | Cloudinary |
| Payment Gateway | SSLCommerz |
| Email | Nodemailer |
| AI Integration | OpenAI API |
| Slug Generation | Slugify |
| Dev Tool | Nodemon |
| Module System | ES Modules (`"type": "module"`) |

---

## Project Structure

```
mern-ecommerce-backend/
├── config/         # Database connection and configuration
├── controllers/    # Route handler logic (users, products, orders, etc.)
├── helpers/        # Reusable helper functions (e.g. file uploads, tokens)
├── middlewares/    # Auth guards, error handlers, and other middleware
├── models/         # Mongoose schemas (User, Product, Order, etc.)
├── payment/        # SSLCommerz payment integration logic
├── routes/         # Express route definitions
├── utils/          # Utility functions (email, slug, etc.)
└── app.js          # App entry point — Express setup, middleware, routes
```

---

## API Overview

| Resource | Endpoints |
|---|---|
| Auth | Register, Login, Logout, Refresh Token |
| Users | Get profile, Update profile, Admin user management |
| Products | CRUD, search, filter by category, slug-based routing |
| Categories | Create, list, update, delete categories |
| Orders | Place order, get orders, update order status |
| Payment | SSLCommerz checkout, payment verification |
| Wishlist | Add/remove products |
| Cart | Add/update/remove cart items |
| AI | OpenAI-powered features |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or Atlas)
- **npm**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/mHasan1037/mern-ecommerce-backend.git
cd mern-ecommerce-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables** (see [Environment Variables](#environment-variables))

4. **Start the development server**

```bash
npm run dev
```

The API will be running at `http://localhost:5000` (or your configured port).

---

## Environment Variables

Create a `.env` file in the root of the project and add the following:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=<your_mongodb_connection_string>

# JWT
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>

# Email (Nodemailer)
EMAIL_HOST=<smtp_host>
EMAIL_PORT=587
EMAIL_USER=<your_email>
EMAIL_PASS=<your_email_password>

# SSLCommerz (Payment)
SSLCOMMERZ_STORE_ID=<your_store_id>
SSLCOMMERZ_STORE_PASSWORD=<your_store_password>
SSLCOMMERZ_IS_LIVE=false

# OpenAI
OPENAI_API_KEY=<your_openai_api_key>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

> **Note:** Never commit your `.env` file to version control.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with Nodemon (auto-reload) |
| `npm start` | Start production server |

---

## Deployment

This backend is deployed on **Render**: [https://mern-ecommerce-frontend-jg1w.onrender.com/](https://mern-ecommerce-frontend-jg1w.onrender.com/)

To deploy your own instance on Render:

1. Push the repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Set the build command to `npm install` and start command to `npm start`.
4. Add all required environment variables in the Render dashboard.
5. Deploy.

---

## License

This project is open source and available under the [MIT License](LICENSE).
