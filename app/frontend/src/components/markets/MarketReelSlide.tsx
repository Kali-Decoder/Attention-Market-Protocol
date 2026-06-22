import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ChevronUp, Clock, Eye, TrendingUp, Wallet } from 'lucide-react'
import type { EnrichedMarket } from '@/hooks/useMarkets'
import { useDemoEngagement } from '@/hooks/useDemoEngagement'
import { formatCount, formatSol, timeRemaining } from '@/lib/format'
import { platformToParam } from '@/lib/demoMarkets'
import { PlatformBadge } from './PlatformBadge'
import { PoolBar } from './PoolBar'
import { EngagementMeter } from './EngagementMeter'

type Props = {
  market: EnrichedMarket
  isActive: boolean
}

export function MarketReelSlide({ market, isActive }: Props) {
  const { onChain, demo } = market
  const totalPool = onChain.totalOver.add(onChain.totalUnder)
  const isLive = onChain.status === 'open'
  const engagement = useDemoEngagement(demo.contentId, demo.platform, demo.threshold, {
    isLive,
    settledValue: onChain.finalEngagement.toNumber(),
  })
  const detailParams = {
    platform: platformToParam(demo.platform),
    contentId: demo.contentId,
  }

  return (
    <div className="flex h-full w-full items-center justify-center gap-4 px-4 py-6">
      {/* Phone-style market card */}
      <div className="relative w-[min(100%,360px)] aspect-[9/16] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
        <div className={`absolute inset-0 bg-gradient-to-br ${demo.gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

        <div className="relative z-10 flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <PlatformBadge platform={demo.platform} />
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <span className="text-8xl drop-shadow-lg">{demo.emoji}</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-white/80">{demo.creator}</p>
              <h2 className="text-xl font-bold text-white leading-tight">{demo.title}</h2>
              <p className="text-sm text-white/70 mt-1 line-clamp-2">{demo.description}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-white/90">
              <span className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
                <Eye className="h-3.5 w-3.5 text-sky-300" />
                {formatCount(engagement.views)} views
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
                <TrendingUp className="h-3.5 w-3.5 text-purple-300" />
                {formatCount(engagement.engagement)} {demo.engagementLabel}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
                <Clock className="h-3.5 w-3.5 text-amber-300" />
                {isLive ? timeRemaining(onChain.deadline) : 'Ended'}
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1">
                <Wallet className="h-3.5 w-3.5 text-emerald-300" />
                {formatSol(totalPool)} pool
              </span>
            </div>

            <EngagementMeter engagement={engagement} label={demo.engagementLabel} compact />
            <PoolBar totalOver={onChain.totalOver} totalUnder={onChain.totalUnder} />
          </div>
        </div>
      </div>

      {/* Action rail (reels-style) */}
      <div className={`flex flex-col items-center gap-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
        <Link
          to="/markets/$platform/$contentId"
          params={detailParams}
          className="flex flex-col items-center group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-black/40 text-lg">
            {demo.emoji}
          </div>
          <span className="mt-1 max-w-[4rem] truncate text-center text-[10px] text-white/80">
            {demo.creator.replace('@', '')}
          </span>
        </Link>

        <Link
          to="/markets/$platform/$contentId"
          params={detailParams}
          className="flex flex-col items-center group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/90 group-hover:bg-emerald-400 transition">
            <ArrowUp className="h-5 w-5 text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-emerald-300">Over</span>
        </Link>

        <Link
          to="/markets/$platform/$contentId"
          params={detailParams}
          className="flex flex-col items-center group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/90 group-hover:bg-rose-400 transition">
            <ArrowDown className="h-5 w-5 text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-rose-300">Under</span>
        </Link>

        <div className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#222]">
            <Eye className="h-5 w-5 text-sky-300" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white tabular-nums">
            {formatCount(engagement.views)}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#222]">
            <TrendingUp className="h-5 w-5 text-purple-300" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">
            {formatCount(demo.threshold)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#222]">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="mt-1 text-[10px] font-semibold text-white">
            {totalPool.gt(0) ? formatSol(totalPool).replace(' SOL', '') : '0'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function MarketReelScrollHint() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 text-xs text-white/50 animate-bounce">
      <ChevronUp className="h-4 w-4 rotate-180" />
      Swipe for next market
    </div>
  )
}
