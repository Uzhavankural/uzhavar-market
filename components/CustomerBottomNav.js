'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/app/context/LanguageContext'

export default function CustomerBottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { key: 'home', name: t('bottomNav.home'), href: '/customer', icon: '🏠' },
    { key: 'search', name: t('bottomNav.search'), href: '/customer/products', icon: '🔍' },
    { key: 'cart', name: t('bottomNav.cart'), href: '/customer/cart', icon: '🛒' },
    { key: 'orders', name: t('bottomNav.orders'), href: '/customer/orders', icon: '📦' },
    { key: 'profile', name: t('bottomNav.profile'), href: '/customer/profile', icon: '👤' },
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50 flex justify-around items-center h-16 sm:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-green-700 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-semibold leading-tight text-center">{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
