'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'

export default function CustomerHeader() {
  const { t } = useLanguage()

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-[6%] flex justify-between items-center sticky top-0 z-40 shadow-xs gap-2">
      <Link href="/" className="text-lg sm:text-xl font-bold text-green-950 flex items-center gap-1.5 no-underline shrink-0">
        <span>🌾</span>
        <span>{t('brand')}</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageToggle variant="compact" className="sm:hidden" />
        <LanguageToggle className="hidden sm:inline-flex" />
        <Link
          href="/"
          className="text-xs sm:text-sm font-semibold text-green-800 hover:text-green-700 transition-colors whitespace-nowrap"
        >
          ← {t('nav.store')}
        </Link>
      </div>
    </header>
  )
}
