/**
 * Password Module
 * Handles password hashing and verification using bcrypt
 */

import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

// Scrypt parameters (adjusted for test environment compatibility)
// In production, use higher values (N=32768, r=8, p=1) for better security
const SCRYPT_N = process.env.NODE_ENV === 'test' ? 1024 : 32768;
const SCRYPT_R = process.env.NODE_ENV === 'test' ? 8 : 8;
const SCRYPT_P = process.env.NODE_ENV === 'test' ? 1 : 1;
const KEYLEN = 64;
const SALT_LENGTH = 32;

/**
 * Generate a random salt
 * @returns {string} Hex-encoded salt
 */
function generateSalt() {
  return randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Hash a password with salt
 * @param {string} password - Plain text password
 * @param {string} salt - Salt to use
 * @returns {Promise<string>} Hashed password (hex)
 */
async function hashPasswordWithSalt(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
}

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password with salt (format: salt:hash)
 */
export async function hashPassword(password) {
  const salt = generateSalt();
  const hash = await hashPasswordWithSalt(password, salt);
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash (format: salt:hash)
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, storedHash) {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) {
      return false;
    }
    const computedHash = await hashPasswordWithSalt(password, salt);
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Check if password meets requirements
 * @param {string} password - Password to check
 * @returns {Object} Validation result
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
};
