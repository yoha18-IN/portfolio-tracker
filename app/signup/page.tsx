'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'code' | 'password'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'signup' }),
      })
      const text = await response.text()
      let data: { error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.tsx:json-parse-fail',message:'Response is not JSON',data:{status:response.status,textPreview:text.slice(0,200),contentType:response.headers.get('content-type')},timestamp:Date.now(),hypothesisId:'E',runId:'trace'})}).catch(()=>{});
        // #endregion
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }
      if (!response.ok) {
        setError(data.error || 'Failed to send code')
        setLoading(false)
        return
      }
      setStep('code')
    } catch {
      setError('Network or server error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, purpose: 'signup' }),
      })
      const text = await response.text()
      let data: { error?: string; verificationToken?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }
      if (!response.ok) {
        setError(data.error || 'Invalid code')
        setLoading(false)
        return
      }
      setVerificationToken(data.verificationToken ?? '')
      setStep('password')
    } catch {
      setError('Network or server error. Please check your connection and try again.')
    }
    setLoading(false)
  }

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/13220964-4688-49cc-bed1-5aea0899f387',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.tsx:handleCompleteSignup',message:'Submitting complete-signup',data:{tokenLen:verificationToken?.length,isEmpty:!verificationToken},timestamp:Date.now(),hypothesisId:'B',runId:'trace'})}).catch(()=>{});
    // #endregion
    try {
      const response = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken,
          password,
          displayName: displayName || undefined,
        }),
      })
      const text = await response.text()
      let data: { error?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        return
      }
      if (!response.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Network or server error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">
            {step === 'email' && 'Enter your email to receive a 6-digit verification code'}
            {step === 'code' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Set your password to complete signup'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">6-Digit Code</label>
              <input
                type="text"
                id="code"
                required
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                placeholder="• • • • • •"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <p className="mt-2 text-sm text-gray-500">Check your inbox for the code</p>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Use different email
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleCompleteSignup} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">Display Name (Optional)</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Your Name"
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="mt-2 text-sm text-gray-500">At least 8 characters with letters and numbers</p>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Complete signup'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
