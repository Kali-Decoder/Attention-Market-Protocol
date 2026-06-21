import { ArrowLeftFromLine, ArrowRightFromLine, Wallet, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import ConnectDialog from './ConnectDialog'
import { useAuth } from '../contexts/authContext'
import { collapseAddress } from '../lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { account, isConnected, connectWallet, disconnect } = useAuth()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [connectDialogOpen, setConnectDialogOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      <button
        onClick={toggleSidebar}
        className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-50 bg-[#232327] border border-[#2f2f35] border-r-0 rounded-r-lg p-2 hover:bg-[#2f2f35] transition-all duration-300 ${isSidebarExpanded ? 'left-64' : 'left-0'}`}
        aria-label="Toggle Sidebar"
      >
        {isSidebarExpanded
          ? <ArrowLeftFromLine className="w-4 h-4 text-white" />
          : <ArrowRightFromLine className="w-4 h-4 text-white" />
        }
      </button>
      <Sidebar isExpanded={isSidebarExpanded} />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300">
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#18181b] border-b border-[#2f2f35] flex items-center px-10 z-20">
          <div className="flex-1 flex items-center">
            <Link to="/" className="flex items-center space-x-2 mr-20">
              <img src="/logo-light-rmbg.png" alt="logo" className="w-8 h-8" />
              <span className="text-white font-bold text-2xl">Reelify</span>
            </Link>
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="text-white text-sm">Home</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#18181b] border border-[#232327] text-white">
                <DropdownMenuItem asChild>
                  <Link to="/" className="text-white hover:bg-gray-800 cursor-pointer">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Markets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-bets" className="text-white hover:bg-gray-800 cursor-pointer">
                    My Bets
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/create" className="text-white hover:bg-gray-800 cursor-pointer">
                    Demo Setup
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wallet" className="text-white hover:bg-gray-800 cursor-pointer">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center space-x-3 ml-8">
            {!isConnected ? (
              <>
                <button onClick={() => setConnectDialogOpen(true)} className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-black transition-all duration-200">Sign In</button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-black text-sm font-medium">S</span>
                    </div>
                    <span className="text-white text-sm">
                      {account ? collapseAddress(account) : 'Connected'}
                    </span>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#18181b] border border-[#232327] text-white">
                  <DropdownMenuItem asChild>
                    <Link to="/my-bets" className="text-white hover:bg-gray-800 cursor-pointer">
                      My Bets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="text-white hover:bg-gray-800 cursor-pointer">
                      <Wallet className="w-4 h-4" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#232327]" />
                  <DropdownMenuItem 
                    onClick={disconnect}
                    className="text-white hover:bg-red-500 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        <main className="flex-1 bg-black text-white p-0 min-h-screen mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        connectWallet={connectWallet}
      />
    </div>
  )
} 