# ⚙️ Techify LMS - Backend API & Architecture

Developed by **[Muhammad Umar](https://www.linkedin.com/in/muhammadumarofficial/)**

Welcome to the backend repository for **Techify LMS**. This Node.js/Express server is engineered for speed, security, and cloud-native deployment.

---

## 🚀 Key Technologies & Architecture

- **Node.js & Native ESM**: Modern ECMAScript Modules for standardized resolution.
- **MongoDB & Mongoose**: Relational NoSQL structure with strict schema validation.
- **Zod Validation**: Robust data contracts for critical payloads (e.g., payments).
- **JWT & Bcrypt**: Enterprise-grade stateless security and password hashing.

---

## 💎 Standout Backend Features

### ☁️ Cloudinary Media Integration
- Direct cloud streaming for thumbnails and video lessons, bypassing local disk limitations.

### ⚡ Vercel Serverless Optimization
- Intelligent connection pooling to mitigate cold-starts in serverless environments.

### 🌱 Automated Database Seeding
- Automatically provisions a massive dataset (17 users, 20 courses, 200 lessons) on the first boot of an empty database.

### 🔐 Robust Role-Based Access Control (RBAC)
- Custom middleware for granular permission management (Admin, Instructor, Student).

---

## 🏗 Project Structure (Backend)

```text
├── src/
│   ├── config/       # Database & Env Setup
│   ├── controllers/  # API Business Logic
│   ├── middleware/   # Auth & Security Guards
│   ├── models/       # Mongoose Schemas
│   ├── routes/       # Endpoint Definitions
│   ├── utils/        # Helpers & Seeder
│   └── index.ts      # Main Server Entry
```

---

## ⚙️ Running Locally

1. **Install dependencies**: `npm install`
2. **Environment Variables**: Create `.env` with `PORT`, `MONGO_URI`, `JWT_SECRET`, and Cloudinary keys.
3. **Start Server**: `npm run dev`

---
Developed by **[Muhammad Umar](https://www.linkedin.com/in/muhammadumarofficial/)** 🚀
