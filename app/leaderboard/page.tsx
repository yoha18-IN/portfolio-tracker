import { getCurrentUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { headers } from 'next/headers'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()

  // Fetch leaderboard data - construct URL from headers
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`
  
  const response = await fetch(
    `${baseUrl}/api/leaderboard`,
    {
      cache: 'no-store',
    }
  )

  const data = await response.json()
  const leaderboard = data.leaderboard || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Public Leaderboard
          </h1>
          <p className="text-gray-600">
            Compare portfolio performance with other users
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No public portfolios yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to share your portfolio performance!
            </p>
            {user && (
              <Link
                href="/dashboard"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Portfolio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Holdings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Return
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry: any, index: number) => {
                    const isCurrentUser = user && entry.ownerId === user.id
                    const rankColor =
                      index === 0
                        ? 'text-yellow-600'
                        : index === 1
                        ? 'text-gray-400'
                        : index === 2
                        ? 'text-orange-600'
                        : 'text-gray-600'

                    return (
                      <tr
                        key={entry.portfolioId}
                        className={isCurrentUser ? 'bg-indigo-50' : ''}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xl font-bold ${rankColor}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/portfolio/${entry.portfolioId}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {entry.portfolioName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {entry.ownerDisplayName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-indigo-600 font-medium">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {entry.holdingsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ${entry.currentValue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              entry.returnPercent >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {entry.returnPercent >= 0 ? '+' : ''}
                            {entry.returnPercent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            About the Leaderboard
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            Rankings are based on portfolio return percentages. Real-time stock prices are fetched from Finnhub API.
          </p>
          <p className="text-sm text-blue-800">
            Prices are automatically updated every 30 seconds for live portfolios. Get your own free Finnhub API key at{' '}
            <a
              href="https://finnhub.io/register"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              finnhub.io
            </a>
            {' '}for higher rate limits.
          </p>
        </div>
      </main>
    </div>
  )
}
