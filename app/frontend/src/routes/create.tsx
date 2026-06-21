import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2, Rocket, Database } from 'lucide-react'
import { useAuth } from '../contexts/authContext'
import { configExists, seedDemoMarkets } from '../lib/solana'
import { DEMO_MARKETS } from '../lib/demoMarkets'
import { platformLabel } from '../lib/demoMarkets'

export const Route = createFileRoute('/create')({
  component: CreatePage,
})

function CreatePage() {
  const { isConnected, connectWallet } = useAuth()
  const wallet = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)

  const seed = async () => {
    if (!wallet.connected) {
      connectWallet()
      return
    }
    setLoading(true)
    try {
      await seedDemoMarkets({ ...wallet, connection } as any)
      setSeeded(true)
      toast.success('Demo markets seeded on-chain!')
    } catch (e: any) {
      toast.error(e?.message ?? 'Seeding failed')
    } finally {
      setLoading(false)
    }
  }

  const checkConfig = async () => {
    const exists = await configExists(connection)
    toast.success(exists ? 'Protocol config exists' : 'Config not initialized yet')
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Demo Setup</h1>
          <p className="text-gray-400">
            Seed pre-made markets on localnet so your demo UI has live on-chain data for visitors to bet on.
          </p>
        </div>

        <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Quick start (localnet)</h2>
          </div>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>Run <code className="text-purple-300">anchor test</code> or <code className="text-purple-300">solana-test-validator</code></li>
            <li>Start frontend: <code className="text-purple-300">cd app/frontend && npm run dev</code></li>
            <li>Connect wallet (Phantom on localhost)</li>
            <li>Click &quot;Seed all demo markets&quot; below</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-[#2f2f35] bg-[#1c1c20] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">{DEMO_MARKETS.length} demo markets</h2>
          </div>
          <ul className="space-y-3">
            {DEMO_MARKETS.map((m) => (
              <li key={m.contentId} className="flex items-center justify-between text-sm border-b border-[#2f2f35] pb-3 last:border-0">
                <div>
                  <span className="text-white font-medium">{m.emoji} {m.title}</span>
                  <span className="text-gray-500 ml-2">· {platformLabel(m.platform)}</span>
                </div>
                <span className="text-gray-400">{m.threshold.toLocaleString()} {m.engagementLabel}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-4">
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-white text-black font-semibold px-6 py-3 rounded-xl"
            >
              Connect wallet
            </button>
          ) : (
            <>
              <button
                onClick={seed}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Seed all demo markets
              </button>
              <button
                onClick={checkConfig}
                className="border border-[#2f2f35] px-6 py-3 rounded-xl text-gray-300 hover:text-white"
              >
                Check config
              </button>
            </>
          )}
          <Link
            to="/"
            className="border border-[#2f2f35] px-6 py-3 rounded-xl text-gray-300 hover:text-white inline-flex items-center"
          >
            View markets
          </Link>
        </div>

        {seeded && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Markets seeded. Head to the homepage to browse and place bets.
          </div>
        )}
      </div>
    </div>
  )
}
