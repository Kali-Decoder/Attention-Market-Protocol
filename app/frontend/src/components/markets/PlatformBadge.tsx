import { platformLabel } from '../../lib/demoMarkets'
import type { Platform } from '../../lib/solana'
import { cn } from '../../lib/utils'

const styles: Record<Platform, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  tikTok: 'bg-black text-white border border-white/20',
  youTube: 'bg-red-600 text-white',
}

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', styles[platform], className)}>
      {platformLabel(platform)}
    </span>
  )
}
