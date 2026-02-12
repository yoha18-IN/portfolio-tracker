import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken, clearSessionCookie } from '@/lib/auth'
import { db } from '@/lib/instantdb-server'

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken()

    if (token) {
      // Delete session from database
      await db.transact([
        db.tx.sessions[token].delete(),
      ])
    }

    // Clear cookie
    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
