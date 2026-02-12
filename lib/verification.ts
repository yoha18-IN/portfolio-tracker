import crypto from 'crypto'
import { db } from './instantdb-server'

// #region agent log
fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:module-load',message:'verification module loaded',data:{},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
// #endregion

const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const TOKEN_SECRET = process.env.VERIFICATION_TOKEN_SECRET || 'portfolio-verification-secret-change-in-production'

export function generateSixDigitCode(): string {
  const code = crypto.randomInt(100000, 999999).toString()
  return code
}

export function createSignedToken(payload: { email: string; purpose: 'signup' | 'reset' }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 10 * 60 * 1000, // 10 min
  })
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex')
  return Buffer.from(`${data}.${signature}`).toString('base64url')
}

export function verifySignedToken(token: string): { email: string; purpose: 'signup' | 'reset' } | null {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'verifySignedToken start',data:{tokenLen:token?.length,isEmpty:!token},timestamp:Date.now(),hypothesisId:'B,D',runId:'trace'})}).catch(()=>{});
  // #endregion
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    // Split at LAST period - email (e.g. user@gmail.com) contains periods, so split('.') would break
    const lastDot = decoded.lastIndexOf('.')
    if (lastDot === -1) return null
    const dataStr = decoded.substring(0, lastDot)
    const signature = decoded.substring(lastDot + 1)
    if (!dataStr || !signature) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'Fail: no dataStr or signature',data:{hasDataStr:!!dataStr,hasSignature:!!signature},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
      // #endregion
      return null
    }

    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(dataStr).digest('hex')
    if (signature !== expectedSig) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'Fail: signature mismatch',data:{},timestamp:Date.now(),hypothesisId:'C',runId:'trace'})}).catch(()=>{});
      // #endregion
      return null
    }

    const payload = JSON.parse(dataStr)
    if (payload.exp < Date.now()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'Fail: token expired',data:{exp:payload.exp,now:Date.now()},timestamp:Date.now(),hypothesisId:'A',runId:'trace'})}).catch(()=>{});
      // #endregion
      return null
    }
    if (payload.purpose !== 'signup' && payload.purpose !== 'reset') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'Fail: wrong purpose',data:{purpose:payload.purpose},timestamp:Date.now(),hypothesisId:'E',runId:'trace'})}).catch(()=>{});
      // #endregion
      return null
    }
    return { email: payload.email, purpose: payload.purpose }
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'verification.ts:verifySignedToken',message:'Fail: catch/parse',data:{errMsg:err instanceof Error?err.message:String(err)},timestamp:Date.now(),hypothesisId:'D',runId:'trace'})}).catch(()=>{});
    // #endregion
    return null
  }
}

export async function storeVerificationCode(email: string, code: string, purpose: 'signup' | 'reset'): Promise<void> {
  const key = email.toLowerCase()
  const expiresAt = Date.now() + CODE_EXPIRY_MS
  const id = crypto.randomUUID()

  await db.transact([
    db.tx.verificationCodes[id].update({
      id,
      email: key,
      code,
      purpose,
      expiresAt,
      createdAt: Date.now(),
    }),
  ])
}

export async function verifyCode(email: string, code: string, purpose: 'signup' | 'reset'): Promise<boolean> {
  const key = email.toLowerCase()

  const data = await db.query({
    verificationCodes: {
      $: {
        where: {
          email: key,
          code,
          purpose,
        },
      },
    },
  }) as { verificationCodes?: { id: string; expiresAt: number }[] }

  const record = data.verificationCodes?.[0]
  if (!record) return false
  if (record.expiresAt < Date.now()) return false

  // Delete used code (one-time use)
  await db.transact([db.tx.verificationCodes[record.id].delete()])
  return true
}
