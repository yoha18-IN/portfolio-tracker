import { NextRequest, NextResponse } from 'next/server'
import { getStockPrices } from '@/lib/prices'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Invalid symbols array' },
        { status: 400 }
      )
    }

    // Limit to 50 symbols at once
    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Too many symbols (max 50)' },
        { status: 400 }
      )
    }

    const prices = await getStockPrices(symbols)

    return NextResponse.json({ prices })
  } catch (error) {
    console.error('Get prices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
