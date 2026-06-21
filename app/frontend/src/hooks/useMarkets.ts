import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { fetchMarkets, type MarketAccount } from '../lib/solana'
import { DEMO_MARKETS, getDemoMeta, type DemoMarketMeta } from '../lib/demoMarkets'

export type EnrichedMarket = {
  onChain: MarketAccount
  demo: DemoMarketMeta
}

export function useMarkets() {
  const { connection } = useConnection()
  const [markets, setMarkets] = useState<EnrichedMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const onChain = await fetchMarkets(connection)
      const enriched: EnrichedMarket[] = onChain
        .map((m) => {
          const demo = getDemoMeta(m.contentId, m.platform)
          if (!demo) return null
          return { onChain: m, demo }
        })
        .filter((m): m is EnrichedMarket => m !== null)

      enriched.sort((a, b) => {
        if (a.onChain.status === 'open' && b.onChain.status !== 'open') return -1
        if (b.onChain.status === 'open' && a.onChain.status !== 'open') return 1
        return b.demo.threshold - a.demo.threshold
      })

      setMarkets(enriched)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load markets')
    } finally {
      setLoading(false)
    }
  }, [connection])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [refresh])

  const openCount = markets.filter((m) => m.onChain.status === 'open').length
  const previewUnseeded = DEMO_MARKETS.length - markets.length

  return { markets, loading, error, refresh, openCount, previewUnseeded }
}
