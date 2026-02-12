import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from './instantdb-server'

const SESSION_COOKIE_NAME = 'portfolio_session'
const SESSION_EXPIRY_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  // Use high cost factor (12) to mitigate short password risk
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePassword(password: string): {
  valid: boolean
  error?: string
} {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

export async function createSession(userId: string): Promise<string> {
  // InstantDB requires entity IDs to be UUIDs - hex tokens are rejected
  const token = crypto.randomUUID()
  const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000

  await db.transact([
    db.tx.sessions[token].update({
      id: token,
      userId,
      token,
      expiresAt,
      createdAt: Date.now(),
    }),
  ])

  return token
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)
  return cookie?.value || null
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}


export async function getCurrentUser() {
  const token = await getSessionToken()
  if (!token) return null
  
  // Query session and user from InstantDB
  const data = await db.query({
    sessions: {
      $: {
        where: {
          token,
        },
      },
    },
  })
  
  const session = (data as { sessions: { id: string; userId: string; token: string; expiresAt: number }[] }).sessions[0]
  if (!session || session.expiresAt < Date.now()) {
    return null
  }
  
  // Fetch user
  const userData = await db.query({
    users: {
      $: {
        where: {
          id: session.userId,
        },
      },
    },
  })
  
  return (userData as { users: { id: string; email: string; displayName: string }[] }).users[0] || null
}
