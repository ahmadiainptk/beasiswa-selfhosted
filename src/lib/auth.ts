// path: src/lib/auth.ts
// Auth library: PBKDF2 password hashing + session management + GARDA SSO
// IMPORTANT: PBKDF2 max 100k iterations on Cloudflare Workers (200k throws)

import { jwtVerify } from "jose";

const ITERATIONS = 100_000;
const COOKIE_NAME = 'beasiswa_session';
const SESSION_DURATION = 60 * 60 * 8; // 8 hours in seconds

/**
 * Hash password with PBKDF2 (100k iterations, SHA-256)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  const computedHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === hashHex;
}

/**
 * Generate random session token (64 hex chars)
 */
export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get session cookie name
 */
export function getCookieName(): string {
  return COOKIE_NAME;
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(): number {
  return SESSION_DURATION;
}

// ===== GARDA SSO =====

export interface GardaUser {
  email: string;
  name: string;
  picture: string | null;
  role: string;
}

/**
 * Verify GARDA JWT token from cookie and check admin registration
 */
export async function verifyGardaToken(
  cookieHeader: string | null,
  env: { GARDA_SECRET?: string; DB?: any }
): Promise<GardaUser | null> {
  if (!cookieHeader) return null;

  // Extract garda_token from cookie string
  const match = cookieHeader.match(/garda_token=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  // GARDA_SECRET WAJIB dari env — tidak ada fallback hardcoded (jangan pernah
  // menyimpan secret di source, apalagi di repo publik).
  const secret = env.GARDA_SECRET || "";
  if (!secret) return null;

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    const email = payload.email as string;
    const name = (payload.name as string) || "Admin";
    const picture = (payload.picture as string) || null;
    let role = "admin";

    // Check D1 admins table for role
    if (env.DB) {
      try {
        const result = await env.DB
          .prepare("SELECT role FROM admins WHERE email = ?1")
          .bind(email)
          .first();
        if (result && result.role) {
          role = result.role as string;
        }
      } catch {
        // DB check failed — use default role
      }
    }

    return { email, name, picture, role };
  } catch {
    return null;
  }
}
