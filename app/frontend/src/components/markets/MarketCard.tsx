import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Clock, Eye, TrendingUp } from 'lucide-react'
import type { EnrichedMarket } from '@/hooks/useMarkets'
import { useDemoEngagement } from '@/hooks/useDemoEngagement'
import { formatCount, formatSol, timeRemaining } from '@/lib/format'
import { platformToParam } from '@/lib/demoMarkets'
import { PlatformBadge } from './PlatformBadge'
import { PoolBar } from './PoolBar'

type Props = {
  market: EnrichedMarket
}

export function MarketCard({ market }: Props) {
  const { onChain, demo } = market
  const isOpen = onChain.status === 'open'
  const totalPool = onChain.totalOver.add(onChain.totalUnder)
  const engagement = useDemoEngagement(demo.contentId, demo.platform, demo.threshold, {
    isLive: isOpen,
    settledValue: onChain.finalEngagement.toNumber(),
  })

  return (
    <Link
      to="/markets/$platform/$contentId"
      params={{ platform: platformToParam(demo.platform), contentId: demo.contentId }}
      className="group block rounded-2xl border border-[#2f2f35] bg-[#1c1c20] overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
    >
      <div className={`h-36 bg-gradient-to-br ${demo.gradient} relative p-5 flex flex-col justify-between`}>
        <div className="flex items-start justify-between">
          <PlatformBadge platform={demo.platform} />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isOpen ? 'bg-green-500/20 text-green-300' : onChain.status === 'settled' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'
          }`}>
            {isOpen ? 'Open' : onChain.status === 'settled' ? 'Settled' : 'Closed'}
          </span>
        </div>
        <div className="text-4xl">{demo.emoji}</div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm text-gray-400">{demo.creator}</p>
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
            {demo.title}
          </h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{demo.description}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>{formatCount(engagement.views)} views</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>{formatCount(engagement.engagement)} {demo.engagementLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{isOpen ? timeRemaining(onChain.deadline) : 'Ended'}</span>
          </div>
        </div>

        <PoolBar totalOver={onChain.totalOver} totalUnder={onChain.totalUnder} />

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-gray-500">Total pool</p>
            <p className="text-sm font-semibold text-white">{formatSol(totalPool)}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-purple-400 font-medium group-hover:gap-2 transition-all">
            {isOpen ? 'Place bet' : 'View market'}
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
