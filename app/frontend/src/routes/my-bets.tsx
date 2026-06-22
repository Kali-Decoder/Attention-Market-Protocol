import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/authContext'
import {
  fetchMarkets,
  fetchUserBets,
  getUserBetStatus,
  type BetAccount,
  type MarketAccount,
} from '@/lib/solana'
import { getDemoMeta } from '@/lib/demoMarkets'
import { lamportsToSol } from '@/lib/format'
import { UserBetCard } from '@/components/markets/UserBetCard'

export const Route = createFileRoute('/my-bets')({
  component: MyBetsPage,
})

type EnrichedBet = { bet: BetAccount; market: MarketAccount }

function MyBetsPage() {
  const { isConnected, connectWallet } = useAuth()
  const wallet = useWallet()
  const { connection } = useConnection()
  const [bets, setBets] = useState<EnrichedBet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!wallet.publicKey) {
      setBets([])
      setLoading(false)
      return
    }

    try {
      const [userBets, markets] = await Promise.all([
        fetchUserBets(connection, wallet.publicKey),
        fetchMarkets(connection),
      ])
      const marketMap = new Map(markets.map((m) => [m.publicKey.toBase58(), m]))

      const enriched = userBets
        .map((bet) => {
          const market = marketMap.get(bet.market.toBase58())
          return market ? { bet, market } : null
        })
        .filter((b): b is EnrichedBet => b !== null)

      setBets(enriched)
    } finally {
      setLoading(false)
    }
  }, [connection, wallet.publicKey])

  useEffect(() => {
    load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const { active, resolved } = useMemo(() => {
    const activeBets: EnrichedBet[] = []
    const resolvedBets: EnrichedBet[] = []

    for (const entry of bets) {
      const status = getUserBetStatus(entry.bet, entry.market)
      if (status === 'active') {
        activeBets.push(entry)
      } else {
        resolvedBets.push(entry)
      }
    }

    return { active: activeBets, resolved: resolvedBets }
  }, [bets])

  const totalStaked = useMemo(
    () => bets.reduce((sum, { bet }) => sum + lamportsToSol(bet.amount), 0),
    [bets],
  )

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[60vh]">
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
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bets</h1>
          <p className="text-gray-400">Your positions across all Reelify markets.</p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-[#2f2f35] px-3 py-2 rounded-lg"
        >
          <RefreshCw className={cnSpin(refreshing)} />
          Refresh
        </button>
      </div>

      {!loading && bets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Stat label="Open positions" value={String(active.length)} />
          <Stat label="Resolved" value={String(resolved.length)} />
          <Stat label="Total staked" value={`${totalStaked.toFixed(2)} SOL`} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : !bets.length ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[#2f2f35]">
          <p className="text-gray-400 mb-2">No bets yet</p>
          <p className="text-sm text-gray-500 mb-6">Place an Over or Under bet on any live market.</p>
          <Link to="/" className="text-purple-400 hover:underline">
            Browse live markets →
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-emerald-300">Active positions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(({ bet, market }) => {
                  const demo = getDemoMeta(market.contentId, market.platform)
                  if (!demo) return null
                  return (
                    <UserBetCard
                      key={bet.publicKey.toBase58()}
                      bet={bet}
                      market={market}
                      demo={demo}
                      onClaimed={load}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-gray-300">Resolved</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resolved.map(({ bet, market }) => {
                  const demo = getDemoMeta(market.contentId, market.platform)
                  if (!demo) return null
                  return (
                    <UserBetCard
                      key={bet.publicKey.toBase58()}
                      bet={bet}
                      market={market}
                      demo={demo}
                      onClaimed={load}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#2f2f35] bg-[#1c1c20] p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

function cnSpin(spinning: boolean) {
  return spinning ? 'w-4 h-4 animate-spin' : 'w-4 h-4'
}
