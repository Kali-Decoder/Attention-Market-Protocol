import { createContext, useContext, ReactNode } from 'react'

interface UserContextType {
  account: string | null
  isConnected: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  account,
  isConnected,
}: { children: ReactNode; account: string | null; isConnected: boolean }) {
  return (
    <UserContext.Provider value={{ account, isConnected }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
