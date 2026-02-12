import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PortfolioView from '@/components/PortfolioView'

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch portfolio data
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/portfolios/${id}`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Portfolio Not Found
            </h2>
            <p className="text-red-700">
              This portfolio does not exist or you don't have permission to view it.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const data = await response.json()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <PortfolioView
        portfolio={data.portfolio}
        holdings={data.holdings}
        isOwner={data.portfolio.userId === user.id}
      />
    </div>
  )
}
