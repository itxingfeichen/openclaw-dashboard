import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Generate access and refresh tokens for a user
 * @param payload - User information to include in token
 * @returns Object containing access token, refresh token, and expiration times
 */
export function generateTokens(payload: JwtPayload): TokenPair {
  const accessTokenExpiresAt = new Date();
  const refreshTokenExpiresAt = new Date();
  
  // Parse expiration times
  const accessExpireMs = parseExpirationTime(ACCESS_TOKEN_EXPIRES_IN);
  const refreshExpireMs = parseExpirationTime(REFRESH_TOKEN_EXPIRES_IN);
  
  accessTokenExpiresAt.setTime(accessTokenExpiresAt.getTime() + accessExpireMs);
  refreshTokenExpiresAt.setTime(refreshTokenExpiresAt.getTime() + refreshExpireMs);

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

/**
 * Verify and decode an access token
 * @param token - JWT access token
 * @returns Decoded payload if valid
 * @throws JsonWebTokenError or TokenExpiredError if invalid
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token
 * @returns Decoded payload if valid
 * @throws JsonWebTokenError or TokenExpiredError if invalid
 */
export function verifyRefreshToken(token: string): JwtPayload & { type: 'refresh' } {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload & { type: 'refresh' };
}

/**
 * Decode a token without verification (for debugging)
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

/**
 * Parse expiration time string to milliseconds
 * @param timeString - Time string like '15m', '7d', '1h'
 * @returns Milliseconds
 */
function parseExpirationTime(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiration time format: ${timeString}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }
}
