import { createContext, useContext, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

interface AuthContextType {
  account: string | null
  isConnected: boolean
  loginType: 'wallet' | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  disconnect: () => void
  walletAccount: string | null
  isWalletConnected: boolean
  keylessAccount: string | null
  disconnectKeylessAccount: () => void
  isKeylessConnected: boolean
  isRestoringSession: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet()
  const { setVisible } = useWalletModal()

  const connectWallet = async () => {
    setVisible(true)
  }

  const disconnectWallet = async () => {
    await wallet.disconnect()
  }

  const account: string | null = wallet.publicKey?.toBase58() ?? null
  const isConnected = !!account
  const loginType: 'wallet' | null = wallet.connected ? 'wallet' : null

  const disconnect = () => {
    disconnectWallet()
  }

  return (
    <AuthContext.Provider value={{
      account,
      isConnected,
      loginType,
      connectWallet,
      disconnectWallet,
      disconnect,
      walletAccount: account,
      keylessAccount: null,
      isWalletConnected: wallet.connected,
      isKeylessConnected: false,
      isRestoringSession: false,
      disconnectKeylessAccount: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 