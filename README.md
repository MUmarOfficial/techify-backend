# Techify LMS - Backend API

This is the backend API for the Techify LMS platform. It is a robust, production-ready Express server written in TypeScript and connected to MongoDB via Mongoose.

## Features

- **Automated Startup Seeding**: The server automatically detects if the connected MongoDB instance is empty. If it is, it safely runs the `seeder.ts` file on startup to populate 20 courses, users, and 200 lessons so your frontend is never broken.
- **JWT Authentication**: Includes secure login, registration, and logout utilizing `HttpOnly` cookies for XSS protection.
- **Role-Based Access Control (RBAC)**: Custom middlewares to enforce Admin, Instructor, and Student roles on necessary API routes.
- **Robust Error Handling**: Centralized error middleware and structured HTTP status codes.

## Local Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in this directory:

```env
PORT=5000
# Connection string to your local MongoDB or Atlas cluster
MONGO_URI=mongodb://127.0.0.1:27017/techify-lms
# A secure random string for signing JWT tokens
JWT_SECRET=my_super_secret_key
# The URL of your frontend to allow CORS
CLIENT_URL=http://localhost:5173
```

### Development Server

Run the development server with live reload:

```bash
npm run dev
```

### Manual Seeding

If you ever wish to completely wipe your database and restart from the exact base state of mock data, you can forcefully run the seeder:

```bash
npm run seed
```
*Warning: This deletes all existing data in the database before repopulating it.*

## Deployment Notes

- When deploying to **Render**, **Railway**, or **Heroku**, ensure you set the `Build Command` to `npm install && npm run build`.
- Set your `Start Command` to `npm run start` (which executes `node dist/index.js`).
- Ensure all environment variables are properly mapped in your host provider's dashboard.
