import { Resend } from 'resend'

// Only create Resend client when API key exists - constructor throws when key is undefined
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// #region agent log
fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email.ts:module-load',message:'email module loaded',data:{},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
// #endregion

const FROM_EMAIL = process.env.EMAIL_FROM || 'Portfolio Tracker <onboarding@resend.dev>'

export async function sendVerificationCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      console.warn('RESEND_API_KEY not set - logging code to console for development:', code)
      console.log(`[DEV] Verification code for ${email}: ${code}`)
      return { success: true }
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Your verification code - Portfolio Tracker',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>Your verification code</h2>
          <p>Use this 6-digit code to verify your email:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">${code}</p>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: 'Failed to send verification email' }
    }

    return { success: true }
  } catch (err) {
    console.error('Email error:', err)
    return { success: false, error: 'Failed to send verification email' }
  }
}
