import { init } from '@instantdb/react'

// Define the schema types
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

type Schema = {
  users: User
  sessions: Session
  portfolios: Portfolio
  holdings: Holding
  verificationCodes: VerificationCode
}

// Initialize InstantDB
// Get your app ID from https://instantdb.com/dash
const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || 'YOUR_APP_ID_HERE'

const db = init<Schema>({ appId: APP_ID })

export { db }
export type { User, Session, Portfolio, Holding, Schema }
