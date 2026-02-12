import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import {
  hashPassword,
  validatePassword,
  validateEmail,
  createSession,
  setSessionCookie,
} from '@/lib/auth'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  displayName: z.string().min(1).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { email, password, displayName } = result.data

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUsers = await db.query({
      users: {
        $: {
          where: {
            email: email.toLowerCase(),
          },
        },
      },
    }) as { users: { id: string }[] }

    if (existingUsers.users.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userId = crypto.randomUUID()
    const now = Date.now()

    await db.transact([
      db.tx.users[userId].update({
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split('@')[0],
        createdAt: now,
      }),
    ])

    // Create session
    const sessionToken = await createSession(userId)
    await setSessionCookie(sessionToken)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email: email.toLowerCase(),
          displayName: displayName || email.split('@')[0],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
