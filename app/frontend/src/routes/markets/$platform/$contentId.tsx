import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeft, Eye, Loader2, Target, Users } from 'lucide-react'
import { useAuth } from '@/contexts/authContext'
import { getDemoMeta, platformFromParam } from '@/lib/demoMarkets'
import { fetchMarket, fetchUserBet } from '@/lib/solana'
import type { BetAccount, MarketAccount } from '@/lib/solana'
import { formatCount, formatDeadline, formatSol, timeRemaining } from '@/lib/format'
import { useDemoEngagement } from '@/hooks/useDemoEngagement'
import { PlatformBadge } from '@/components/markets/PlatformBadge'
import { PoolBar } from '@/components/markets/PoolBar'
import { BetPanel } from '@/components/markets/BetPanel'
import { EngagementMeter } from '@/components/markets/EngagementMeter'

export const Route = createFileRoute('/markets/$platform/$contentId')({
  component: MarketDetailPage,
})

function MarketDetailPage() {
  const { platform: platformParam, contentId } = Route.useParams()
  const platform = platformFromParam(platformParam)
  const demo = getDemoMeta(contentId, platform)
  const { connection } = useConnection()
  const wallet = useWallet()
  const { connectWallet } = useAuth()

  const [market, setMarket] = useState<MarketAccount | null>(null)
  const [userBet, setUserBet] = useState<BetAccount | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const m = await fetchMarket(connection, contentId, platform)
      setMarket(m)
      if (m && wallet.publicKey) {
        const bet = await fetchUserBet(connection, m.publicKey, wallet.publicKey)
        setUserBet(bet)
      } else {
        setUserBet(null)
      }
    } finally {
      setLoading(false)
    }
  }, [connection, contentId, platform, wallet.publicKey])

  useEffect(() => {
    load()
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [load])

  const engagement = useDemoEngagement(contentId, platform, demo?.threshold ?? 0, {
    isLive: market?.status === 'open',
    settledValue: market?.finalEngagement.toNumber() ?? 0,
  })

  if (!demo) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white flex items-center justify-center">
        <p>Unknown market</p>
      </div>
    )
  }

  if (loading && !market) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-white p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to markets
        </Link>
        <div className="text-center py-20">
          <p className="text-xl font-semibold">Market not found on-chain</p>
          <p className="text-gray-400 mt-2">This demo market hasn&apos;t been seeded yet.</p>
          <Link to="/create" className="inline-block mt-6 bg-purple-600 px-6 py-3 rounded-xl font-semibold">
            Seed demo markets
          </Link>
        </div>
      </div>
    )
  }

  const totalPool = market.totalOver.add(market.totalUnder)

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> All markets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-3xl bg-gradient-to-br ${demo.gradient} p-8 md:p-10 relative overflow-hidden`}>
              <div className="absolute top-4 right-4">
                <PlatformBadge platform={demo.platform} />
              </div>
              <div className="text-6xl mb-4">{demo.emoji}</div>
              <p className="text-white/80 text-sm">{demo.creator}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">{demo.title}</h1>
              <p className="text-white/90 mt-3 max-w-xl">{demo.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye className="w-4 h-4 text-sky-400" />}
                label={`Live ${demo.engagementLabel}`}
                value={formatCount(engagement.current)}
                highlight
              />
              <StatCard
                icon={<Target className="w-4 h-4 text-purple-400" />}
                label="Target"
                value={`${formatCount(market.engagementThreshold.toNumber())} ${demo.engagementLabel}`}
              />
              <StatCard
                icon={<Users className="w-4 h-4 text-blue-400" />}
                label="Total pool"
                value={formatSol(totalPool)}
              />
              <StatCard
                label="Deadline"
                value={timeRemaining(market.deadline)}
                sub={formatDeadline(market.deadline)}
              />
            </div>

            <EngagementMeter engagement={engagement} label={demo.engagementLabel} />

            <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6">
              <h3 className="font-semibold mb-4">Pool distribution</h3>
              <PoolBar totalOver={market.totalOver} totalUnder={market.totalUnder} />
              <p className="text-xs text-gray-500 mt-4">
                Bettors on the winning side split the losing pool (minus 2% protocol fee) proportionally to their stake.
              </p>
            </div>

            {market.status === 'settled' && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
                <h3 className="font-semibold text-blue-200 mb-2">Settlement result</h3>
                <p className="text-white">
                  Final engagement: <strong>{formatCount(market.finalEngagement.toNumber())}</strong>{' '}
                  {demo.engagementLabel} · Winner: <strong>{market.outcome?.toUpperCase()}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <BetPanel
              market={market}
              userBet={userBet}
              onSuccess={load}
              onConnect={connectWallet}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-[#2f2f35] bg-[#1c1c20] p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <p className={`font-semibold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
