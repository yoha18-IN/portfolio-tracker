import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCode, createSignedToken } from '@/lib/verification'
import { validateEmail } from '@/lib/auth'

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
  purpose: z.enum(['signup', 'reset']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = verifyCodeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const { email, code, purpose } = result.data
    const normalizedEmail = email.toLowerCase()

    const emailValidation = validateEmail(normalizedEmail)
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    const isValid = await verifyCode(normalizedEmail, code, purpose)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    const token = createSignedToken({ email: normalizedEmail, purpose })
    return NextResponse.json({
      success: true,
      verificationToken: token,
      message: purpose === 'signup' ? 'Email verified. Set your password.' : 'Email verified. Set your new password.',
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'An error occurred while verifying the code' },
      { status: 500 }
    )
  }
}
