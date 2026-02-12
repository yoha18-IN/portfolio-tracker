import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { db } from '@/lib/instantdb-server'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's portfolios
  const data = await db.query({
    portfolios: {
      $: {
        where: {
          userId: user.id,
        },
      },
    },
  })

  const portfolios = (data as { portfolios?: { id: string; name: string; description?: string; isPublic: boolean; createdAt: number }[] }).portfolios ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.displayName}!
          </h1>
          <p className="text-gray-600">
            Manage your portfolios and track your investment performance
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Portfolios
            </h2>
            <Link
              href="/portfolio/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              + Create Portfolio
            </Link>
          </div>

          {portfolios.length === 0 ? (
            <div className="text-center py-12">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No portfolios yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first portfolio to start tracking your investments
              </p>
              <Link
                href="/portfolio/new"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Create Your First Portfolio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {portfolio.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        portfolio.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {portfolio.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  {portfolio.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {portfolio.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created {new Date(portfolio.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Getting Started
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Create a portfolio to organize your investments</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Add stock holdings with symbols, shares, and purchase price</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Track performance and compare with others on the leaderboard</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
