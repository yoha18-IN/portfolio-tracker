import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Portfolio Tracker
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Track your stock portfolio and compare performance with others
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/signup"
                className="bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-indigo-700 transition text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/leaderboard"
                className="bg-white text-indigo-600 py-3 px-8 rounded-lg font-medium hover:bg-gray-50 transition text-lg border-2 border-indigo-600"
              >
                View Leaderboard
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Register & Track
              </h3>
              <p className="text-gray-600">
                Create an account with just an email and 6-digit password to start
                tracking your investments
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg
                  className="w-12 h-12"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Portfolios
              </h3>
              <p className="text-gray-600">
                Add stocks, track holdings, and monitor real-time performance with
                automatic calculations
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-indigo-600 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Compare & Compete
              </h3>
              <p className="text-gray-600">
                Share your portfolio publicly and see how you rank against other
                investors on the leaderboard
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Join the community and start tracking your portfolio today
            </p>
            <Link
              href="/signup"
              className="inline-block bg-indigo-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-indigo-700 transition text-lg"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
