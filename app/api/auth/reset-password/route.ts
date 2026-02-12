import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { hashPassword, validatePassword } from '@/lib/auth'
import { verifySignedToken } from '@/lib/verification'

const resetPasswordSchema = z.object({
  verificationToken: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = resetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const { verificationToken, password } = result.data

    const payload = verifySignedToken(verificationToken)
    if (!payload || payload.purpose !== 'reset') {
      return NextResponse.json(
        { error: 'Invalid or expired verification. Please start over.' },
        { status: 400 }
      )
    }

    const email = payload.email

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    const data = await db.query({
      users: {
        $: { where: { email } },
      },
    }) as { users?: { id: string }[] }

    const user = data.users?.[0]
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const passwordHash = await hashPassword(password)
    await db.transact([
      db.tx.users[user.id].update({ passwordHash }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting password' },
      { status: 500 }
    )
  }
}
