import { createFileRoute } from '@tanstack/react-router'
import { useMarkets } from '@/hooks/useMarkets'
import { MarketReelFeed } from '@/components/markets/MarketReelFeed'

export const Route = createFileRoute('/')({
  component: MarketsPage,
})

function MarketsPage() {
  const { markets, loading, error, refresh } = useMarkets()

  return (
    <MarketReelFeed
      markets={markets}
      loading={loading}
      error={error}
      onRefresh={refresh}
    />
  )
}
