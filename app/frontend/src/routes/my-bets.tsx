import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/authContext'
import { fetchMarkets, fetchUserBets, type BetAccount, type MarketAccount } from '../lib/solana'
import { getDemoMeta, platformToParam } from '../lib/demoMarkets'
import { formatSol } from '../lib/format'

export const Route = createFileRoute('/my-bets')({
  component: MyBetsPage,
})

function MyBetsPage() {
  const { isConnected, connectWallet } = useAuth()
  const wallet = useWallet()
  const { connection } = useConnection()
  const [bets, setBets] = useState<{ bet: BetAccount; market: MarketAccount }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!wallet.publicKey) {
      setBets([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [userBets, markets] = await Promise.all([
        fetchUserBets(connection, wallet.publicKey),
        fetchMarkets(connection),
      ])
      const marketMap = new Map(markets.map((m) => [m.publicKey.toBase58(), m]))
      setBets(
        userBets
          .map((bet) => {
            const market = marketMap.get(bet.market.toBase58())
            return market ? { bet, market } : null
          })
          .filter((b): b is { bet: BetAccount; market: MarketAccount } => b !== null),
      )
    } finally {
      setLoading(false)
    }
  }, [connection, wallet.publicKey])

  useEffect(() => {
    load()
  }, [load])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Connect your wallet</h2>
          <p className="text-gray-400 mb-6">View your open positions and claim rewards.</p>
          <button onClick={connectWallet} className="bg-purple-600 px-6 py-3 rounded-xl font-semibold">
            Connect wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Bets</h1>
        <p className="text-gray-400 mb-8">Your positions across all Reelify markets.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : !bets.length ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[#2f2f35]">
            <p className="text-gray-400 mb-4">No bets yet</p>
            <Link to="/" className="text-purple-400 hover:underline">
              Browse open markets →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map(({ bet, market }) => {
              const demo = getDemoMeta(market.contentId, market.platform)
              const won = market.status === 'settled' && market.outcome === bet.side
              return (
                <Link
                  key={bet.publicKey.toBase58()}
                  to="/markets/$platform/$contentId"
                  params={{
                    platform: platformToParam(market.platform),
                    contentId: market.contentId,
                  }}
                  className="block rounded-xl border border-[#2f2f35] bg-[#1c1c20] p-5 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{demo?.title ?? market.contentId}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {bet.side.toUpperCase()} · {formatSol(bet.amount)} · {market.status}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {market.status === 'settled' && won && !bet.claimed && (
                        <span className="text-blue-400 font-medium">Claim available</span>
                      )}
                      {bet.claimed && <span className="text-gray-500">Claimed</span>}
                      {market.status === 'settled' && !won && (
                        <span className="text-rose-400">Lost</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
