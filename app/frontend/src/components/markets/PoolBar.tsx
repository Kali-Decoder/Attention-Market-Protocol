import type { BN } from '@coral-xyz/anchor'
import { formatSol } from '../../lib/format'

type Props = {
  totalOver: BN
  totalUnder: BN
}

export function PoolBar({ totalOver, totalUnder }: Props) {
  const over = totalOver.toNumber()
  const under = totalUnder.toNumber()
  const total = over + under
  const overPct = total > 0 ? (over / total) * 100 : 50

  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden bg-[#2a2a30]">
        <div className="bg-emerald-500 transition-all" style={{ width: `${overPct}%` }} />
        <div className="bg-rose-500 transition-all" style={{ width: `${100 - overPct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-emerald-400">Over {formatSol(totalOver)}</span>
        <span className="text-rose-400">Under {formatSol(totalUnder)}</span>
      </div>
    </div>
  )
}
