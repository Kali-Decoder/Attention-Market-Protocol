import { Link } from '@tanstack/react-router'
import { LayoutGrid, PlusCircle, Ticket, Wallet } from 'lucide-react'

interface SidebarProps {
  isExpanded: boolean
}

const nav = [
  { to: '/', label: 'Markets', icon: LayoutGrid },
  { to: '/my-bets', label: 'My Bets', icon: Ticket },
  { to: '/create', label: 'Demo Setup', icon: PlusCircle },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
] as const

export function Sidebar({ isExpanded }: SidebarProps) {
  return (
    <aside className={`relative flex flex-col bg-[#1f1f23] border-r transition-all duration-300 border border-[#2f2f35] ${isExpanded ? 'w-64' : 'w-0'} mt-16 h-[calc(100vh-64px)]`}>
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs text-[#adadb8] font-bold uppercase mb-3">Reelify</h2>
          <ul className="space-y-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[#27272e] hover:text-white transition-colors [&.active]:bg-purple-600/20 [&.active]:text-purple-300"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 p-4 rounded-xl bg-[#18181b] border border-[#2f2f35]">
            <p className="text-xs text-gray-500 mb-1">Protocol</p>
            <p className="text-sm text-gray-300">Attention Market</p>
            <p className="text-xs text-gray-500 mt-2">SOL escrow · Over/Under</p>
          </div>
        </div>
      )}
    </aside>
  )
}
