'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FarmerBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'My Products', href: '/farmer/products', icon: '🌾' },
    { name: 'Orders', href: '/farmer/orders', icon: '📦' },
    { name: 'Transaction', href: '/farmer/earnings', icon: '💸' },
    { name: 'My Profile', href: '/farmer/profile', icon: '👤' },
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50 flex justify-around items-center h-16 sm:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-green-700 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-semibold text-center leading-tight">{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
