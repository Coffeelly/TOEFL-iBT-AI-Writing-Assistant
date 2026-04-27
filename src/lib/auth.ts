// =============================================================================
// Auth Utilities
// =============================================================================
// Password hashing and JWT token management.
// Requirements: 3.4, 3.6, 3.7
// =============================================================================

import bcryptjs from 'bcryptjs'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

/** Hash a plaintext password with bcrypt (cost factor 12) */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

/** Verify a plaintext password against a stored bcrypt hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

/** Sign a JWT for the given user (HS256, 7-day expiry) */
export async function signToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/** Verify and decode a JWT; returns null on any failure (expired, tampered, malformed) */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

/** Extract the Bearer token from an Authorization header; returns null if absent or malformed */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return token.length > 0 ? token : null
}
