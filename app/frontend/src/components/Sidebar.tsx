import { Link } from '@tanstack/react-router'
import { LayoutGrid, PlusCircle, Ticket, Wallet } from 'lucide-react'

interface SidebarProps {
  isExpanded: boolean
}

const nav = [
  { to: '/', label: 'Live Markets', icon: LayoutGrid },
  { to: '/my-bets', label: 'My Bets', icon: Ticket },
  { to: '/create', label: 'Demo Setup', icon: PlusCircle },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
] as const

export function Sidebar({ isExpanded }: SidebarProps) {
  return (
    <aside
      className={`sticky top-0 shrink-0 flex flex-col bg-[#1f1f23] border-r border-[#2f2f35] transition-all duration-300 h-full overflow-hidden ${isExpanded ? 'w-64' : 'w-0'}`}
    >
      {isExpanded && (
        <div className="p-4 h-full overflow-hidden">
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
