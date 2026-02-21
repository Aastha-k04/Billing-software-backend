# Node.js Backend - User Authentication API

A complete Node.js backend with MongoDB, JWT authentication, and user profile management.

## Features

- User Registration
- User Login with JWT
- Protected Routes
- User Profile Create/Update
- Error Handling Middleware
- MongoDB Integration
- Password Hashing with bcrypt

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mybackend
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Running the Server

Development mode with auto-restart:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Public Routes

**Register User**
```
POST /api/users/register
Body: { "name": "John Doe", "email": "john@example.com", "password": "123456" }
```

**Login User**
```
POST /api/users/login
Body: { "email": "john@example.com", "password": "123456" }
```

### Protected Routes

**Get User Profile**
```
GET /api/users/profile
Headers: { "Authorization": "Bearer <token>" }
```

**Update User Profile**
```
PUT /api/users/profile
Headers: { "Authorization": "Bearer <token>" }
Body: { 
  "name": "John Updated",
  "profile": {
    "bio": "Software Developer",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "+1234567890"
  }
}
```

## Project Structure

```
my-backend/
├─ package.json
├─ .env
├─ server.js
└─ src/
   ├─ config/
   │  └─ db.js
   ├─ models/
   │  └─ User.js
   ├─ controllers/
   │  └─ userController.js
   ├─ routes/
   │  └─ userRoutes.js
   ├─ middleware/
   │  ├─ authMiddleware.js
   │  └─ errorMiddleware.js
   └─ utils/
      └─ generateToken.js
```

## Testing with cURL or Postman

Register:
```bash
curl -X POST http://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"123456"}'
```

Login:
```bash
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

Get Profile:
```bash
curl -X GET http://localhost:5001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Requirements

- Node.js v14+
- MongoDB running locally or remote connection
# Quantile
# Quantile
# Quantile
