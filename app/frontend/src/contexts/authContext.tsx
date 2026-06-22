import { createContext, useContext, useCallback, type ReactNode } from 'react'
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

  const connectWallet = useCallback(async () => {
    setVisible(true)
  }, [setVisible])

  const disconnectWallet = useCallback(async () => {
    await wallet.disconnect()
  }, [wallet])

  const account = wallet.publicKey?.toBase58() ?? null
  const isConnected = wallet.connected && !!account
  const loginType: 'wallet' | null = isConnected ? 'wallet' : null

  const disconnect = () => {
    void disconnectWallet()
  }

  return (
    <AuthContext.Provider
      value={{
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
        isRestoringSession: wallet.connecting,
        disconnectKeylessAccount: () => {},
      }}
    >
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
