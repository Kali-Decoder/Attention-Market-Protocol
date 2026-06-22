import { createFileRoute, Link } from '@tanstack/react-router'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ExternalLink, Loader2, RefreshCw, Droplets } from 'lucide-react'
import { collapseAddress } from '../lib/utils'

export const Route = createFileRoute('/wallet')({
  component: WalletPage,
})

const DEVNET_FAUCETS = [
  { name: 'Solana official faucet', url: 'https://faucet.solana.com/' },
  { name: 'QuickNode faucet', url: 'https://faucet.quicknode.com/solana/devnet' },
]

function WalletPage() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [airdropping, setAirdropping] = useState(false)

  const rpcUrl = process.env.PUBLIC_SOLANA_RPC_URL || ''
  const isDevnet = rpcUrl.includes('devnet')

  const refreshBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalance(null)
      return
    }
    setLoading(true)
    try {
      const lamports = await connection.getBalance(wallet.publicKey, 'confirmed')
      setBalance(lamports / LAMPORTS_PER_SOL)
    } finally {
      setLoading(false)
    }
  }, [wallet.publicKey, connection])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  const requestAirdrop = async () => {
    if (!wallet.publicKey) return
    if (!isDevnet) {
      toast.error('Airdrop only works on devnet. Switch PUBLIC_SOLANA_RPC_URL to devnet.')
      return
    }

    setAirdropping(true)
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL)
      await connection.confirmTransaction(sig, 'confirmed')
      toast.success('Received 1 devnet SOL!')
      await refreshBalance()
    } catch (e: any) {
      toast.error(
        e?.message?.includes('429') || e?.message?.includes('airdrop')
          ? 'Faucet rate limited — try an external faucet below.'
          : e?.message ?? 'Airdrop failed',
      )
    } finally {
      setAirdropping(false)
    }
  }

  if (!wallet.connected || !wallet.publicKey) {
    return (
      <div className="min-h-full bg-[#0f0f11] text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Wallet not connected</h2>
          <p className="text-gray-400 mt-2">Connect Phantom or Solflare (Devnet) to view balance.</p>
          <Link to="/" className="inline-block mt-6 text-purple-400 hover:underline">
            Back to markets
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0f0f11] text-white p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-gray-400 mt-1">Your connected Solana wallet on {isDevnet ? 'Devnet' : 'localnet'}.</p>
        </div>

        <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Network</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDevnet ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
              {isDevnet ? 'Devnet' : 'Custom RPC'}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Address</p>
            <p className="font-mono text-sm break-all">{wallet.publicKey.toBase58()}</p>
            <p className="text-gray-500 text-sm mt-1">{collapseAddress(wallet.publicKey.toBase58())}</p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Balance</p>
              <p className="text-3xl font-bold">
                {balance === null ? '—' : `${balance.toFixed(4)} SOL`}
              </p>
            </div>
            <button
              onClick={refreshBalance}
              disabled={loading}
              className="flex items-center gap-2 text-sm border border-[#2f2f35] px-3 py-2 rounded-lg hover:bg-[#252529]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>

          {isDevnet && (
            <button
              onClick={requestAirdrop}
              disabled={airdropping}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 font-semibold py-3 rounded-xl"
            >
              {airdropping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}
              Request 1 devnet SOL (airdrop)
            </button>
          )}

          <button
            onClick={() => wallet.disconnect()}
            className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 py-2.5 rounded-xl text-sm"
          >
            Disconnect wallet
          </button>
        </div>

        {isDevnet && (
          <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6">
            <h2 className="font-semibold mb-2">Need more devnet SOL?</h2>
            <p className="text-sm text-gray-400 mb-4">
              Make sure Phantom is set to <strong className="text-gray-300">Devnet</strong> (Settings → Developer Settings → Testnet mode).
              If the in-app airdrop is rate-limited, use a faucet:
            </p>
            <ul className="space-y-2">
              {DEVNET_FAUCETS.map((f) => (
                <li key={f.url}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-purple-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {f.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              CLI: <code className="text-purple-300">solana airdrop 2 &lt;YOUR_ADDRESS&gt; --url devnet</code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
