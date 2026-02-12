import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import {
  hashPassword,
  validatePassword,
  createSession,
  setSessionCookie,
} from '@/lib/auth'
import { verifySignedToken } from '@/lib/verification'

const completeSignupSchema = z.object({
  verificationToken: z.string(),
  password: z.string(),
  displayName: z.string().min(1).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = completeSignupSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      )
    }

    const { verificationToken, password, displayName } = result.data

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts',message:'Before verifySignedToken',data:{tokenLen:verificationToken?.length,isEmpty:!verificationToken},timestamp:Date.now(),hypothesisId:'B',runId:'trace'})}).catch(()=>{});
    // #endregion
    const payload = verifySignedToken(verificationToken)
    if (!payload || payload.purpose !== 'signup') {
      return NextResponse.json(
        { error: 'Invalid or expired verification. Please start over.' },
        { status: 400 }
      )
    }

    const email = payload.email

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts',message:'After verify, before db.query',data:{},timestamp:Date.now(),hypothesisId:'F',runId:'trace'})}).catch(()=>{});
    // #endregion
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    const existingUsers = await db.query({
      users: {
        $: { where: { email } },
      },
    }) as { users?: { id: string }[] }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts',message:'After db.query',data:{},timestamp:Date.now(),hypothesisId:'F',runId:'trace'})}).catch(()=>{});
    // #endregion
    if (existingUsers.users?.length) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts',message:'After hashPassword',data:{},timestamp:Date.now(),hypothesisId:'F',runId:'trace'})}).catch(()=>{});
    // #endregion
    const userId = crypto.randomUUID()
    const now = Date.now()

    await db.transact([
      db.tx.users[userId].update({
        id: userId,
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
        createdAt: now,
      }),
    ])

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts',message:'After db.transact',data:{},timestamp:Date.now(),hypothesisId:'F',runId:'trace'})}).catch(()=>{});
    // #endregion
    const sessionToken = await createSession(userId)
    await setSessionCookie(sessionToken)

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email,
          displayName: displayName || email.split('@')[0],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // #region agent log
    const errMsg = error instanceof Error ? error.message : String(error)
    const errName = error instanceof Error ? error.name : ''
    await fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'complete-signup/route.ts:catch',message:'Caught error',data:{errMsg,errName},timestamp:Date.now(),hypothesisId:'F',runId:'trace'})}).catch(()=>{});
    // #endregion
    console.error('Complete signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
