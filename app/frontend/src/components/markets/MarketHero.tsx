import { Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react'

type Props = {
  openCount: number
  onConnect?: () => void
}

export function MarketHero({ openCount, onConnect }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#2f2f35] bg-gradient-to-br from-[#1a1025] via-[#18181b] to-[#0f172a] p-8 md:p-12">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 text-purple-300 text-sm font-medium mb-4 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          <Sparkles className="w-4 h-4" />
          Solana Prediction Markets for Short-Form Content
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Bet on the next viral reel
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl">
          Stake SOL on whether Instagram, TikTok, or YouTube content will finish over or under an engagement target.
          {openCount > 0 && ` ${openCount} market${openCount === 1 ? '' : 's'} open for betting right now.`}
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Over / Under pools
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            On-chain escrow
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            Phantom & Solflare
          </div>
        </div>
        {onConnect && (
          <button
            onClick={onConnect}
            className="mt-8 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-purple-100 transition-colors"
          >
            Connect wallet to bet
          </button>
        )}
      </div>
    </section>
  )
}
