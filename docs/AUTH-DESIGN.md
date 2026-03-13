# Authentication System Design

## Overview

The OpenClaw Dashboard authentication system provides secure user authentication using JWT (JSON Web Tokens) with support for access tokens, refresh tokens, role-based access control, and rate limiting.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes  │────▶│   Services  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Middleware  │     │Repositories │
                    └──────────────┘     └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  Auth Module │     │  Database   │
                    └──────────────┘     └─────────────┘
```

## Components

### 1. JWT Module (`src/auth/jwt.js`)

Handles JWT token generation and verification.

**Functions:**
- `generateAccessToken(payload)` - Generate short-lived access token (1 hour default)
- `generateRefreshToken(payload)` - Generate long-lived refresh token (7 days default)
- `verifyToken(token)` - Verify and decode token
- `decodeToken(token)` - Decode token without verification
- `isTokenExpired(token)` - Check if token is expired
- `getTokenExpiration(token)` - Get token expiration timestamp

**Token Payload:**
```javascript
{
  userId: number,
  username: string,
  email: string,
  role: string,
  type: 'access' | 'refresh',
  iat: number,    // Issued at
  exp: number     // Expiration
}
```

### 2. Password Module (`src/auth/password.js`)

Handles password hashing and verification using Node.js crypto (scrypt).

**Functions:**
- `hashPassword(password)` - Hash password with random salt
- `verifyPassword(password, hash)` - Verify password against hash
- `validatePasswordStrength(password)` - Validate password requirements

**Password Requirements:**
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Hash Format:**
```
<salt>:<hash>
```
Where both salt and hash are hex-encoded.

### 3. Middleware (`src/auth/middleware.js`)

Authentication and authorization middleware for Express routes.

**Middleware Functions:**

#### `requireAuth`
Requires valid JWT access token. Attaches user to `req.user`.

```javascript
// Usage
router.get('/protected', requireAuth, (req, res) => {
  // req.user is available
});
```

#### `optionalAuth`
Attaches user if valid token provided, but doesn't require it.

```javascript
// Usage
router.get('/public', optionalAuth, (req, res) => {
  // req.user may be available
});
```

#### `hasRole(...roles)`
Role-based access control. Checks if user has one of the specified roles.

```javascript
// Usage
router.get('/admin', requireAuth, hasRole('admin'), (req, res) => {
  // Only admins can access
});

// Multiple roles
router.get('/staff', requireAuth, hasRole('admin', 'moderator'), (req, res) => {
  // Admins and moderators can access
});
```

#### `requireAdmin`
Shorthand for `hasRole('admin')`.

#### `rateLimiter`
Rate limiting for login attempts (5 attempts per 15 minutes per IP).

```javascript
// Usage
router.post('/login', rateLimiter, authController.login);
```

**Rate Limit Headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `Retry-After` - Seconds until limit resets (on 429 response)

### 4. Auth Service (`src/services/auth-service.js`)

Business logic for authentication operations.

**Functions:**

#### `login(username, password, ipAddress, userAgent)`
Authenticate user and return tokens.

**Returns:**
```javascript
{
  accessToken: string,
  refreshToken: string,
  expiresIn: 3600,
  tokenType: 'Bearer',
  user: {
    id: number,
    username: string,
    email: string,
    role: string
  }
}
```

#### `logout(refreshToken)`
Revoke refresh token and session.

#### `refreshAccessToken(refreshToken)`
Generate new access token using refresh token.

**Returns:**
```javascript
{
  accessToken: string,
  refreshToken?: string,  // Only if old token was expiring
  expiresIn: 3600,
  tokenType: 'Bearer'
}
```

#### `getCurrentUser(userId)`
Get current user information.

#### `validateToken(token)`
Validate token and return token info.

### 5. User Service (`src/services/user-service.js`)

User management operations.

**Functions:**
- `createUserAccount(userData)` - Create new user
- `getUserByIdService(id, includeSensitive)` - Get user by ID
- `getAllUsersService(options)` - Get all users with pagination
- `updateUserAccount(id, updateData)` - Update user
- `changePassword(id, currentPassword, newPassword)` - Change password
- `adminResetPassword(id, newPassword)` - Admin password reset
- `updateUserStatus(id, status)` - Update user status
- `deleteUserAccount(id)` - Delete user
- `userHasRole(userId, role)` - Check user role
- `userIsAdmin(userId)` - Check if user is admin

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
User login.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "user",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**Error Responses:**
- `400` - Missing credentials
- `401` - Invalid credentials or account not active
- `429` - Too many attempts (rate limited)

#### POST `/api/auth/logout`
User logout.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST `/api/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",  // Only if old token expiring
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**Error Responses:**
- `400` - Missing refresh token
- `401` - Token expired or invalid

#### GET `/api/auth/me`
Get current user info.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-03-13T00:00:00.000Z",
    "lastLoginAt": "2026-03-13T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Invalid token
- `404` - User not found

#### POST `/api/auth/verify`
Verify token validity.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "userId": 1,
      "username": "user",
      "role": "user"
    }
  }
}
```

### User Routes (`/api/users`)

All user routes require authentication and admin role.

#### GET `/api/users`
Get all users with pagination.

**Query Parameters:**
- `limit` (default: 10) - Max results
- `offset` (default: 0) - Offset
- `search` - Search query (username or email)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 50,
      "hasMore": true
    }
  }
}
```

#### POST `/api/users`
Create a new user.

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "StrongPass123!",
  "role": "user"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-03-13T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Error Responses:**
- `400` - Missing required fields or validation failed
- `409` - Username or email already exists

#### GET `/api/users/:id`
Get user by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-03-13T00:00:00.000Z",
    "lastLoginAt": "2026-03-13T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid user ID
- `404` - User not found

#### PUT `/api/users/:id`
Update user.

**Request:**
```json
{
  "email": "updated@example.com",
  "role": "admin",
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "User updated successfully"
}
```

**Error Responses:**
- `400` - Invalid user ID or no update data
- `404` - User not found
- `409` - Email already exists

#### PATCH `/api/users/:id/status`
Update user status.

**Request:**
```json
{
  "status": "inactive"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {...},
  "message": "User status updated successfully"
}
```

**Error Responses:**
- `400` - Invalid status or missing status
- `404` - User not found

#### DELETE `/api/users/:id`
Delete user.

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid user ID or cannot delete last admin
- `404` - User not found

## Security Considerations

### Token Security
- Access tokens are short-lived (1 hour)
- Refresh tokens are longer-lived (7 days) but can be revoked
- Tokens are signed with HS256 algorithm
- Secret key must be kept secure (use environment variable)

### Password Security
- Passwords are hashed using scrypt (N=32768, r=8, p=1)
- Random 32-byte salt generated for each password
- Password strength validation enforced
- Passwords never stored or transmitted in plain text

### Rate Limiting
- Login attempts limited to 5 per 15 minutes per IP
- Rate limit state stored in memory (use Redis in production)
- Automatic cleanup of old rate limit entries

### Session Management
- Refresh tokens stored in sessions table
- Sessions can be revoked on logout
- Session expiration tracked

### Best Practices
1. **Use HTTPS** - Always use HTTPS in production
2. **Secure Secret Key** - Use strong, random JWT_SECRET in production
3. **Token Storage** - Store tokens securely on client (httpOnly cookies recommended)
4. **CORS** - Configure CORS appropriately for your domain
5. **Logging** - Log authentication failures for security monitoring
6. **Input Validation** - All inputs validated and sanitized

## Environment Variables

```bash
# Server
PORT=8080
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_PATH=./data/openclaw.db
```

## Testing

Run tests with:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

Test files:
- `tests/auth.test.js` - Comprehensive tests for auth module, services, and middleware

## Usage Examples

### Client-Side Authentication Flow

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'StrongPass123!'
  })
});

const { data: { accessToken, refreshToken } } = await loginResponse.json();

// Store tokens securely
localStorage.setItem('refreshToken', refreshToken);
// Prefer httpOnly cookie for access token

// Make authenticated request
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Handle token expiration
if (response.status === 401) {
  // Refresh token
  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const { data: { accessToken: newAccessToken } } = await refreshResponse.json();
  // Retry original request with new token
}

// Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

### Protected Route Example

```javascript
import { requireAuth, hasRole } from '../auth/middleware.js';

// Route that requires authentication
router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Route that requires admin role
router.get('/admin/users', requireAuth, hasRole('admin'), (req, res) => {
  // Only admins can access
});
```

## Troubleshooting

### Common Issues

**"Invalid or expired token"**
- Token may have expired (check expiration time)
- Token may be malformed
- JWT_SECRET may have changed

**"Token expired"**
- Access tokens expire after 1 hour
- Use refresh token to get new access token
- If refresh token also expired, user must login again

**"Too many attempts"**
- Login rate limit exceeded
- Wait 15 minutes or contact administrator
- Check if under brute force attack

**"Invalid credentials"**
- Username/email or password incorrect
- Account may be inactive or suspended
- Check user status in database

## Future Enhancements

- [ ] OAuth2 integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] Account lockout after failed attempts
- [ ] Session management UI
- [ ] Audit logging for auth events
- [ ] Redis-based rate limiting
- [ ] Token blacklisting
- [ ] Device fingerprinting

## References

- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
