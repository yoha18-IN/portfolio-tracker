/**
 * Server-side InstantDB client using Admin SDK.
 * Use this in API routes - the React client does not support db.query on the backend.
 */
import { init } from '@instantdb/admin'

type User = {
  id: string
  email: string
  passwordHash: string
  displayName: string
  createdAt: number
}

type Session = {
  id: string
  userId: string
  token: string
  expiresAt: number
  createdAt: number
}

type Portfolio = {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: number
}

type Holding = {
  id: string
  portfolioId: string
  symbol: string
  shares: number
  avgBuyPrice: number
  createdAt: number
  updatedAt: number
}

type VerificationCode = {
  id: string
  email: string
  code: string
  purpose: string
  expiresAt: number
  createdAt: number
}

type PortfolioSnapshot = {
  id: string
  portfolioId: string
  timestamp: number
  totalValue: number
  totalCost: number
  holdingsSnapshot: string // JSON serialized array of holdings
}

type Schema = {
  users: User
  sessions: Session
  portfolios: Portfolio
  holdings: Holding
  verificationCodes: VerificationCode
  portfolioSnapshots: PortfolioSnapshot
}

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || 'YOUR_APP_ID_HERE'
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN

const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
})

export { db }
export type { Schema, User, Session, Portfolio, Holding, VerificationCode, PortfolioSnapshot }
