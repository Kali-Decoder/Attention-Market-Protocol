import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import type { EnrichedMarket } from '@/hooks/useMarkets'
import { MarketReelScrollHint, MarketReelSlide } from './MarketReelSlide'

type Props = {
  markets: EnrichedMarket[]
  loading: boolean
  error: string | null
  onRefresh: () => Promise<void>
}

export function MarketReelFeed({ markets, loading, error, onRefresh }: Props) {
  const openMarkets = markets.filter((m) => m.onChain.status === 'open')
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const scrollToIndex = useCallback((index: number) => {
    const el = containerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, openMarkets.length - 1))
    const slide = el.children[clamped] as HTMLElement | undefined
    slide?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveIndex(clamped)
  }, [openMarkets.length])

  useEffect(() => {
    setActiveIndex(0)
  }, [openMarkets.length])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !openMarkets.length) return

    const onScroll = () => {
      const slideHeight = el.clientHeight
      if (!slideHeight) return
      const index = Math.round(el.scrollTop / slideHeight)
      setActiveIndex(Math.max(0, Math.min(index, openMarkets.length - 1)))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [openMarkets.length])

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  if (loading && !openMarkets.length) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0f0f11]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0f0f11] p-8 text-center">
        <div>
          <p className="text-red-300 mb-2">{error}</p>
          <Link to="/create" className="text-purple-400 underline">Seed markets →</Link>
        </div>
      </div>
    )
  }

  if (!openMarkets.length) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0f0f11] p-8 text-center">
        <div>
          <p className="text-xl font-semibold text-white mb-2">No live markets</p>
          <p className="text-gray-400 mb-6">Seed demo markets to start the feed.</p>
          <Link
            to="/create"
            className="inline-block rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500"
          >
            Seed demo markets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] bg-[#0f0f11] overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h1 className="text-lg font-bold text-white">Live Markets</h1>
          <p className="text-xs text-gray-400">
            {activeIndex + 1} / {openMarkets.length} · scroll to explore
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white hover:bg-black/60"
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Vertical snap feed */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
        {openMarkets.map((market, index) => (
          <section
            key={market.onChain.publicKey.toBase58()}
            className="h-full min-h-full snap-start snap-always flex items-center justify-center"
          >
            <MarketReelSlide market={market} isActive={index === activeIndex} />
          </section>
        ))}
      </div>

      {activeIndex < openMarkets.length - 1 && <MarketReelScrollHint />}

      {/* Prev / next */}
      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        <button
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] hover:bg-[#333] disabled:opacity-30 transition"
          aria-label="Previous market"
        >
          <ChevronUp className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex >= openMarkets.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222] hover:bg-[#333] disabled:opacity-30 transition"
          aria-label="Next market"
        >
          <ChevronDown className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5">
        {openMarkets.map((m, i) => (
          <button
            key={m.onChain.publicKey.toBase58()}
            onClick={() => scrollToIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === activeIndex ? 'w-2 bg-purple-400' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to market ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
