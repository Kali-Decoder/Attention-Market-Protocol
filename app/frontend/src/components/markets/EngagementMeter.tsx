import { Eye, TrendingUp } from 'lucide-react'
import { formatCount } from '@/lib/format'
import type { DemoEngagement } from '@/hooks/useDemoEngagement'

type Props = {
  engagement: DemoEngagement
  label: string
  compact?: boolean
}

export function EngagementMeter({ engagement, label, compact }: Props) {
  const { engagement: engagementValue, threshold, progress, isOverTarget, isSimulated } = engagement

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-white/90">
            <Eye className="h-3.5 w-3.5 text-sky-300" />
            {formatCount(engagementValue)} {label}
          </span>
          <span className="text-white/50">/ {formatCount(threshold)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOverTarget ? 'bg-emerald-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#2f2f35] bg-[#1c1c20] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-medium text-white">Live {label}</span>
        </div>
        {isSimulated && (
          <span className="text-[10px] uppercase tracking-wide text-amber-400/90">simulated</span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-white tabular-nums">{formatCount(engagementValue)}</p>
        <p className="text-sm text-gray-400 pb-1">
          target {formatCount(threshold)}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#2f2f35]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isOverTarget ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <TrendingUp className={`h-3.5 w-3.5 ${isOverTarget ? 'text-emerald-400' : 'text-purple-400'}`} />
        {isOverTarget
          ? `Above target — Over bettors leading`
          : `${(100 - progress).toFixed(0)}% to reach target`}
      </p>
    </div>
  )
}
