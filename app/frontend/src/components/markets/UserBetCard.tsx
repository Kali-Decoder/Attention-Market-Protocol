import { Link } from '@tanstack/react-router'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { ArrowDown, ArrowUp, Clock, Loader2, Trophy } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { BetAccount, MarketAccount } from '@/lib/solana'
import {
  claimReward,
  estimateBetPayout,
  getUserBetStatus,
  type UserBetStatus,
} from '@/lib/solana'
import type { DemoMarketMeta } from '@/lib/demoMarkets'
import { platformToParam } from '@/lib/demoMarkets'
import { formatSol, timeRemaining } from '@/lib/format'
import { useDemoEngagement } from '@/hooks/useDemoEngagement'
import { PlatformBadge } from './PlatformBadge'
import { cn } from '@/lib/utils'

type Props = {
  bet: BetAccount
  market: MarketAccount
  demo: DemoMarketMeta
  onClaimed: () => void
}

const statusStyles: Record<UserBetStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/20 text-emerald-300' },
  'won-unclaimed': { label: 'Won — claim reward', className: 'bg-blue-500/20 text-blue-300' },
  'won-claimed': { label: 'Won — claimed', className: 'bg-blue-500/20 text-blue-300' },
  lost: { label: 'Lost', className: 'bg-rose-500/20 text-rose-300' },
  closed: { label: 'Closed', className: 'bg-gray-500/20 text-gray-300' },
}

export function UserBetCard({ bet, market, demo, onClaimed }: Props) {
  const { connection } = useConnection()
  const anchorWallet = useAnchorWallet()
  const [claiming, setClaiming] = useState(false)

  const status = getUserBetStatus(bet, market)
  const isOver = bet.side === 'over'
  const isOpen = market.status === 'open'
  const payout = estimateBetPayout(bet, market)

  const engagement = useDemoEngagement(demo.contentId, demo.platform, demo.threshold, {
    isLive: isOpen,
    settledValue: market.finalEngagement.toNumber(),
  })

  const claim = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!anchorWallet) return

    setClaiming(true)
    try {
      await claimReward({ connection, wallet: anchorWallet }, market.publicKey)
      toast.success('Reward claimed!')
      onClaimed()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Claim failed'
      toast.error(message)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Link
      to="/markets/$platform/$contentId"
      params={{ platform: platformToParam(demo.platform), contentId: demo.contentId }}
      className="group block rounded-2xl border border-[#2f2f35] bg-[#1c1c20] overflow-hidden hover:border-purple-500/50 transition-colors"
    >
      <div className={cn('h-24 bg-gradient-to-br relative p-4 flex items-end', demo.gradient)}>
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <PlatformBadge platform={demo.platform} />
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusStyles[status].className)}>
            {statusStyles[status].label}
          </span>
        </div>
        <span className="text-3xl">{demo.emoji}</span>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm text-gray-400">{demo.creator}</p>
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
            {demo.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg',
              isOver
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
            )}
          >
            {isOver ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {bet.side.toUpperCase()}
          </span>
          <div>
            <p className="text-xs text-gray-500">Your stake</p>
            <p className="text-sm font-semibold text-white">{formatSol(bet.amount)}</p>
          </div>
          {status === 'won-unclaimed' && (
            <div>
              <p className="text-xs text-gray-500">Est. payout</p>
              <p className="text-sm font-semibold text-blue-300">{formatSol(payout)}</p>
            </div>
          )}
          {status === 'won-claimed' && (
            <div>
              <p className="text-xs text-gray-500">Payout received</p>
              <p className="text-sm font-semibold text-blue-300">{formatSol(payout)}</p>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{timeRemaining(market.deadline)}</span>
            <span className="text-gray-600">·</span>
            <span>
              {engagement.engagement.toLocaleString()} / {demo.threshold.toLocaleString()} {demo.engagementLabel}
            </span>
          </div>
        )}

        {market.status === 'settled' && (
          <p className="text-sm text-gray-400">
            Result: <span className="text-white font-medium">{market.outcome?.toUpperCase()}</span> won
            {status === 'lost' && ' — your side did not win'}
          </p>
        )}

        {status === 'won-unclaimed' && (
          <button
            type="button"
            onClick={claim}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Claim {formatSol(payout)}
          </button>
        )}
      </div>
    </Link>
  )
}
