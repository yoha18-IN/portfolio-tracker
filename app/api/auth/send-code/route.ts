import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/instantdb-server'
import { validateEmail } from '@/lib/auth'
import { generateSixDigitCode, storeVerificationCode } from '@/lib/verification'
import { sendVerificationCode } from '@/lib/email'

const sendCodeSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['signup', 'reset']),
})

// #region agent log
fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:module-load',message:'send-code route module loaded',data:{},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
// #endregion

export async function POST(request: NextRequest) {
  // #region agent log
  await fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:entry',message:'POST handler entered',data:{},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
  // #endregion
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const result = sendCodeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const { email, purpose } = result.data
    const normalizedEmail = email.toLowerCase()

    const emailValidation = validateEmail(normalizedEmail)
    if (!emailValidation.valid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 })
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:before-query',message:'Before db.query',data:{purpose},timestamp:Date.now(),hypothesisId:'A',runId:'trace'})}).catch(()=>{});
    // #endregion
    if (purpose === 'signup') {
      const data = await db.query({
        users: {
          $: { where: { email: normalizedEmail } },
        },
      }) as { users?: { id: string }[] }
      if (data.users?.length) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Log in instead.' },
          { status: 409 }
        )
      }
    } else {
      const data = await db.query({
        users: {
          $: { where: { email: normalizedEmail } },
        },
      }) as { users?: { id: string }[] }
      if (!data.users?.length) {
        return NextResponse.json(
          { error: 'No account found with this email' },
          { status: 404 }
        )
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:after-query',message:'After db.query',data:{},timestamp:Date.now(),hypothesisId:'A',runId:'trace'})}).catch(()=>{});
    // #endregion
    const code = generateSixDigitCode()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:before-store',message:'Before storeVerificationCode',data:{},timestamp:Date.now(),hypothesisId:'B',runId:'trace'})}).catch(()=>{});
    // #endregion
    await storeVerificationCode(normalizedEmail, code, purpose)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:after-store',message:'After storeVerificationCode',data:{},timestamp:Date.now(),hypothesisId:'B',runId:'trace'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:before-send',message:'Before sendVerificationCode',data:{},timestamp:Date.now(),hypothesisId:'C',runId:'trace'})}).catch(()=>{});
    // #endregion
    const sent = await sendVerificationCode(normalizedEmail, code)

    if (!sent.success) {
      return NextResponse.json(
        { error: sent.error || 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your email' })
  } catch (error) {
    // #region agent log
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : undefined
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'send-code/route.ts:catch',message:'Caught error',data:{error:errMsg,stack:errStack?.slice(0,500)},timestamp:Date.now(),hypothesisId:'A,B,C',runId:'trace'})}).catch(()=>{});
    // #endregion
    console.error('Send code error:', error)
    return NextResponse.json(
      { error: 'An error occurred while sending the code' },
      { status: 500 }
    )
  }
}
