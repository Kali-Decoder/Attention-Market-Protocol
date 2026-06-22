import { useState } from 'react'
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import type { BetAccount, BetSide, MarketAccount } from '../../lib/solana'
import { claimReward, getUserBetStatus, placeBet, estimateBetPayout } from '../../lib/solana'
import { formatSol } from '../../lib/format'
import { cn } from '../../lib/utils'

type Props = {
  market: MarketAccount
  userBet: BetAccount | null
  onSuccess: () => void
  onConnect: () => void
}

export function BetPanel({ market, userBet, onSuccess, onConnect }: Props) {
  const wallet = useWallet()
  const anchorWallet = useAnchorWallet()
  const { connection } = useConnection()
  const [side, setSide] = useState<BetSide>('over')
  const [amount, setAmount] = useState('0.1')
  const [loading, setLoading] = useState(false)

  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'
  const canBet = wallet.connected && isOpen && !userBet
  const canClaim =
    wallet.connected &&
    isSettled &&
    userBet &&
    !userBet.claimed &&
    userBet.side === market.outcome
  const betStatus = userBet ? getUserBetStatus(userBet, market) : null
  const estimatedPayout = userBet ? estimateBetPayout(userBet, market) : null

  const place = async () => {
    if (!wallet.connected || !anchorWallet) {
      onConnect()
      return
    }
    const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
    if (!lamports || lamports <= 0) {
      toast.error('Enter a valid SOL amount')
      return
    }

    setLoading(true)
    try {
      await placeBet({ connection, wallet: anchorWallet }, {
        market: market.publicKey,
        side,
        lamports,
      })
      toast.success(`Bet placed on ${side.toUpperCase()}`)
      onSuccess()
    } catch (e: any) {
      toast.error(e?.message ?? 'Bet failed')
    } finally {
      setLoading(false)
    }
  }

  const claim = async () => {
    if (!wallet.connected || !anchorWallet) return
    setLoading(true)
    try {
      await claimReward({ connection, wallet: anchorWallet }, market.publicKey)
      toast.success('Reward claimed!')
      onSuccess()
    } catch (e: any) {
      toast.error(e?.message ?? 'Claim failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen && !canClaim && userBet) {
    const lost = betStatus === 'lost'
    const claimed = betStatus === 'won-claimed'

    return (
      <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Your position</h3>
        <div className="rounded-xl bg-[#252529] p-4 text-sm space-y-2">
          <p className="text-gray-400">You bet</p>
          <p className="text-white font-semibold text-lg">
            {userBet.side.toUpperCase()} · {formatSol(userBet.amount)}
          </p>
          {lost && (
            <p className="text-rose-400 font-medium">
              Market settled {market.outcome?.toUpperCase()} — you did not win this round.
            </p>
          )}
          {claimed && estimatedPayout && (
            <p className="text-blue-300 font-medium">Claimed {formatSol(estimatedPayout)}</p>
          )}
          {isSettled && !lost && !claimed && (
            <p className="text-gray-400">This market has settled.</p>
          )}
        </div>
        {!isSettled && (
          <p className="text-sm text-gray-500 text-center">
            {market.status === 'closed' ? 'This market is closed.' : 'Betting is closed.'}
          </p>
        )}
      </div>
    )
  }

  if (!isOpen && !canClaim && !userBet) {
    return (
      <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6 text-center">
        <p className="text-gray-400">
          {isSettled ? 'This market has settled. Betting is closed.' : 'This market is closed.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6 space-y-5">
      <h3 className="text-lg font-semibold text-white">
        {canClaim ? 'Claim your winnings' : userBet ? 'Your position' : 'Place your bet'}
      </h3>

      {userBet && (
        <div className="rounded-xl bg-[#252529] p-4 text-sm space-y-1">
          <p className="text-gray-400">You bet</p>
          <p className="text-white font-semibold text-lg">
            {userBet.side.toUpperCase()} · {formatSol(userBet.amount)}
          </p>
          {isOpen && (
            <p className="text-emerald-400 text-xs">Position locked until settlement</p>
          )}
        </div>
      )}

      {canClaim && estimatedPayout && (
        <button
          onClick={claim}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Claim {formatSol(estimatedPayout)}
        </button>
      )}

      {canBet && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(['over', 'under'] as BetSide[]).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  'flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all',
                  side === s
                    ? s === 'over'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : 'border-[#2f2f35] text-gray-400 hover:border-gray-500',
                )}
              >
                {s === 'over' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {s === 'over' ? 'Over' : 'Under'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Amount (SOL)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border border-[#2f2f35] rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
            />
          </div>

          <button
            onClick={place}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {wallet.connected ? `Bet ${side.toUpperCase()}` : 'Connect wallet to bet'}
          </button>
        </>
      )}

      {!wallet.connected && isOpen && !userBet && (
        <button
          onClick={onConnect}
          className="w-full border border-[#2f2f35] text-white py-3 rounded-xl hover:bg-[#252529]"
        >
          Connect wallet
        </button>
      )}
    </div>
  )
}
