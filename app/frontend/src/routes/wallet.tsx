import { createFileRoute } from '@tanstack/react-router'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { collapseAddress } from '../lib/utils'

export const Route = createFileRoute('/wallet')({
  component: WalletPage,
})

function WalletPage() {
  const wallet = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!wallet.publicKey) {
        setBalance(null)
        return
      }
      const lamports = await connection.getBalance(wallet.publicKey, 'confirmed')
      setBalance(lamports / LAMPORTS_PER_SOL)
    }
    run()
  }, [wallet.publicKey, connection])

  if (!wallet.connected || !wallet.publicKey) {
    return (
      <div className="min-h-screen bg-[#18181b] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Wallet not connected</h2>
          <p className="text-gray-400 mt-2">Use the connect button in the top right to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#18181b] text-white p-6">
      <div className="max-w-3xl mx-auto bg-[#232327] rounded-xl border border-[#2f2f35] p-6">
        <h1 className="text-2xl font-bold mb-4">Solana Wallet</h1>
        <p className="text-gray-300 mb-2">Address: {collapseAddress(wallet.publicKey.toBase58())}</p>
        <p className="text-gray-300 mb-6">Balance: {balance === null ? 'Loading...' : `${balance.toFixed(4)} SOL`}</p>
        <button
          className="bg-red-600 px-4 py-2 rounded"
          onClick={() => wallet.disconnect()}
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
