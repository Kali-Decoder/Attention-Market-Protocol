import { createFileRoute, Link } from '@tanstack/react-router'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/authContext'
import { useMarkets } from '../hooks/useMarkets'
import { MarketCard } from '../components/markets/MarketCard'
import { MarketHero } from '../components/markets/MarketHero'

export const Route = createFileRoute('/')({
  component: MarketsPage,
})

function MarketsPage() {
  const { isConnected, connectWallet } = useAuth()
  const { markets, loading, error, refresh, openCount } = useMarkets()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const openMarkets = markets.filter((m) => m.onChain.status === 'open')
  const settledMarkets = markets.filter((m) => m.onChain.status === 'settled')

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
        <MarketHero
          openCount={openCount}
          onConnect={!isConnected ? connectWallet : undefined}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Markets</h2>
            <p className="text-gray-400 text-sm mt-1">
              Pick a market and bet on whether engagement finishes over or under the target.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-[#2f2f35] px-4 py-2 rounded-lg"
          >
            {loading || refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {error}
            <p className="mt-2 text-red-200/80">
              Make sure your local validator is running and demo markets are seeded.{' '}
              <Link to="/create" className="underline">Go to setup →</Link>
            </p>
          </div>
        )}

        {loading && !markets.length ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : !markets.length ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-[#2f2f35]">
            <p className="text-xl font-semibold mb-2">No markets on-chain yet</p>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Seed the demo markets on localnet so visitors can browse and place bets.
            </p>
            <Link
              to="/create"
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl"
            >
              Seed demo markets
            </Link>
          </div>
        ) : (
          <>
            {openMarkets.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Open for betting ({openMarkets.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openMarkets.map((m) => (
                    <MarketCard key={m.onChain.publicKey.toBase58()} market={m} />
                  ))}
                </div>
              </section>
            )}

            {settledMarkets.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Settled ({settledMarkets.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settledMarkets.map((m) => (
                    <MarketCard key={m.onChain.publicKey.toBase58()} market={m} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
