# User Service

Handles user authentication, registration, and user profile management.

## Overview

The User Service is responsible for:
- User registration and account creation
- User authentication (login)
- JWT token generation
- User profile retrieval
- Password hashing and security

## Architecture

```
Client Request
    │
    ▼
User Service (Port 8001)
    │
    ├──► Registration Endpoint
    │       └──► Password Hashing (bcrypt)
    │       └──► User Creation (MongoDB)
    │       └──► JWT Token Generation
    │
    ├──► Login Endpoint
    │       └──► Credential Validation
    │       └──► JWT Token Generation
    │
    └──► Profile Endpoint
            └──► User Data Retrieval
```

## API Endpoints

**Note:** All endpoints below are service-level routes. When accessed through the API Gateway, they are prefixed with `/api/users` (e.g., `/api/users/register`).

### `POST /register`
Creates a new user account.

**Gateway Access:** `POST /api/users/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User created",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `POST /login`
Authenticates a user and returns a JWT token.

**Gateway Access:** `POST /api/users/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `GET /me`
Retrieves the current authenticated user's profile.

**Gateway Access:** `GET /api/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Database

**Technology:** MongoDB

**Schema:**
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

1. **Password Hashing:** Uses bcrypt with salt rounds of 10
2. **JWT Tokens:** Tokens expire after 2 hours
3. **Token Payload:** Contains user ID and username
4. **Password Exclusion:** Passwords are never returned in API responses

## Configuration

**Environment Variables:**
- `MONGO_URL`: MongoDB connection string (default: `mongodb://user-db:27017/bookstore`)
- `MONGO_DB`: Database name (default: `bookstore`)
- `JWT_SECRET`: Secret key for JWT signing (default: 'devsecret')

## Dependencies

- `express`: Web framework
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token generation
- `mongoose`: MongoDB ODM

## Running Locally

```bash
# Install dependencies
npm install

# Set environment variables
export MONGO_URL=mongodb://localhost:27017/bookstore
export JWT_SECRET=your-secret-key

# Start server
node index.js
```

## Error Handling

- **400 Bad Request:** Missing username or password
- **401 Unauthorized:** Invalid credentials or missing token
- **409 Conflict:** Username already exists
- **500 Internal Server Error:** Database or server errors

