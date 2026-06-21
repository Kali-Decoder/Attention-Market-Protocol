import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import type { BN } from '@coral-xyz/anchor'

export function lamportsToSol(lamports: BN | number | bigint): number {
  const n = typeof lamports === 'object' && lamports !== null && 'toNumber' in lamports
    ? (lamports as BN).toNumber()
    : Number(lamports)
  return n / LAMPORTS_PER_SOL
}

export function formatSol(lamports: BN | number | bigint, digits = 2): string {
  return `${lamportsToSol(lamports).toFixed(digits)} SOL`
}

export function formatCount(n: number | BN): string {
  const v = typeof n === 'object' && n !== null && 'toNumber' in n ? (n as BN).toNumber() : Number(n)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toLocaleString()
}

export function formatDeadline(unixTs: BN | number): string {
  const ts = typeof unixTs === 'object' && unixTs !== null && 'toNumber' in unixTs
    ? (unixTs as BN).toNumber()
    : Number(unixTs)
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeRemaining(unixTs: BN | number): string {
  const ts = typeof unixTs === 'object' && unixTs !== null && 'toNumber' in unixTs
    ? (unixTs as BN).toNumber()
    : Number(unixTs)
  const diff = ts * 1000 - Date.now()
  if (diff <= 0) return 'Ended'

  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h left`
  if (hours > 0) return `${hours}h left`
  const mins = Math.floor(diff / 60_000)
  return `${mins}m left`
}
