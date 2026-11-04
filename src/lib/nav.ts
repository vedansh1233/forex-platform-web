import { ArrowLeftRight, Calculator, CandlestickChart, History, LayoutDashboard, ListChecks, UserRound, type LucideIcon } from 'lucide-react'

/** The app's pages, in sidebar order (also listed in the command palette). */
export const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end: boolean; keywords: string }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, keywords: 'home wallet portfolio balance' },
  { to: '/markets', label: 'Markets', icon: CandlestickChart, end: false, keywords: 'rates prices charts forex crypto' },
  { to: '/trade', label: 'Trade', icon: ArrowLeftRight, end: false, keywords: 'buy sell convert exchange order' },
  { to: '/orders', label: 'Orders', icon: ListChecks, end: false, keywords: 'limit alerts open history' },
  { to: '/tools', label: 'Tools', icon: Calculator, end: false, keywords: 'calculator pip position strength correlation sessions' },
  { to: '/history', label: 'History', icon: History, end: false, keywords: 'transactions ledger activity' },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false, keywords: 'account settings user' },
]
