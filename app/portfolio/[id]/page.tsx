import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PortfolioView from '@/components/PortfolioView'
import { db } from '@/lib/instantdb-server'

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

  // Fetch portfolio data directly from database
  const data = (await db.query({
    portfolios: {
      $: {
        where: {
          id,
        },
      },
    },
    holdings: {
      $: {
        where: {
          portfolioId: id,
        },
      },
    },
  })) as {
    portfolios: {
      id: string
      userId: string
      name: string
      description?: string
      isPublic: boolean
      createdAt: number
    }[]
    holdings: {
      id: string
      symbol: string
      shares: number
      avgBuyPrice: number
      createdAt: number
      updatedAt: number
    }[]
  }

  const portfolio = data.portfolios[0]

  if (!portfolio) {
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

  // Check authorization - must be owner or public
  if (portfolio.userId !== user.id && !portfolio.isPublic) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Unauthorized
            </h2>
            <p className="text-red-700">
              You don't have permission to view this private portfolio.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <PortfolioView
        portfolio={portfolio}
        holdings={data.holdings}
        isOwner={portfolio.userId === user.id}
      />
    </div>
  )
}
