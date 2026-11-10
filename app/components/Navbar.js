'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'

export default function Navbar({ activePage = '' }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setRole(profile?.role || user.user_metadata?.role || 'customer')
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs font-sans">
      <div className="w-[92%] max-w-[1240px] mx-auto min-h-[64px] sm:min-h-[72px] flex items-center justify-between gap-3">
        
        {/* LOGO */}
        <Link 
          href="/" 
          className="text-lg sm:text-2xl font-bold text-green-950 flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl sm:text-3xl">🌾</span>
          <span>{t('brand')}</span>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-semibold text-gray-700">
          <Link 
            href="/" 
            className={`transition-colors hover:text-green-700 whitespace-nowrap ${activePage === 'home' ? 'text-green-800 font-bold border-b-2 border-green-700 pb-0.5' : ''}`}
          >
            {t('nav.home')}
          </Link>
          <Link 
            href="/customer/products" 
            className={`transition-colors hover:text-green-700 whitespace-nowrap ${activePage === 'products' ? 'text-green-800 font-bold border-b-2 border-green-700 pb-0.5' : ''}`}
          >
            {t('nav.products')}
          </Link>
          <Link 
            href="/about" 
            className={`transition-colors hover:text-green-700 whitespace-nowrap ${activePage === 'about' ? 'text-green-800 font-bold border-b-2 border-green-700 pb-0.5' : ''}`}
          >
            {t('nav.aboutUs')}
          </Link>
          <Link 
            href="/community-guidelines" 
            className={`transition-colors hover:text-green-700 whitespace-nowrap ${activePage === 'guidelines' ? 'text-green-800 font-bold border-b-2 border-green-700 pb-0.5' : ''}`}
          >
            {t('nav.guidelines')}
          </Link>
          <Link 
            href="/contact" 
            className={`transition-colors hover:text-green-700 whitespace-nowrap ${activePage === 'contact' ? 'text-green-800 font-bold border-b-2 border-green-700 pb-0.5' : ''}`}
          >
            {t('nav.contact')}
          </Link>
        </nav>

        {/* DESKTOP TRANSLATE & AUTH BUTTONS */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <LanguageToggle />

          {!loading && user ? (
            <>
              {role === 'farmer' && (
                <Link
                  href="/farmer"
                  className="px-3.5 py-2 rounded-lg bg-green-50 text-green-800 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>👨‍🌾</span>
                  <span>{t('nav.farmerDashboard')}</span>
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-3.5 py-2 rounded-lg bg-green-50 text-green-800 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>⚙️</span>
                  <span>{t('nav.adminPanel')}</span>
                </Link>
              )}
              {role === 'customer' && (
                <Link
                  href="/customer"
                  className="px-3.5 py-2 rounded-lg bg-green-50 text-green-800 border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>🛒</span>
                  <span>{t('nav.dashboard')}</span>
                </Link>
              )}
              <Link
                href="/cart"
                className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center gap-1"
                title={t('nav.viewCart')}
              >
                <span>🛒</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-xs whitespace-nowrap"
              >
                {t('nav.createAccount')}
              </Link>
            </>
          )}
        </div>

        {/* MOBILE RIGHT CONTROLS: TRANSLATE + MENU TOGGLE */}
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <LanguageToggle variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <span className="text-xl font-bold">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>
        </div>

      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-5 py-4 space-y-3 shadow-md">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-800 hover:text-green-800 border-b border-gray-100"
          >
            🏠 {t('nav.home')}
          </Link>
          <Link
            href="/customer/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-800 hover:text-green-800 border-b border-gray-100"
          >
            🌾 {t('nav.exploreProducts')}
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-800 hover:text-green-800 border-b border-gray-100"
          >
            📖 {t('nav.aboutUs')}
          </Link>
          <Link
            href="/community-guidelines"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-800 hover:text-green-800 border-b border-gray-100"
          >
            🤝 {t('nav.communityGuidelines')}
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-gray-800 hover:text-green-800 border-b border-gray-100"
          >
            ✉️ {t('nav.contactUs')}
          </Link>

          <div className="pt-2 flex flex-col gap-2">
            {!loading && user ? (
              <>
                <Link
                  href={role === 'farmer' ? '/farmer' : role === 'admin' ? '/admin' : '/customer'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-bold"
                >
                  {role === 'farmer'
                    ? t('nav.farmerDashboard')
                    : role === 'admin'
                    ? t('nav.adminDashboard')
                    : t('nav.customerDashboard')}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full py-2.5 text-center rounded-lg bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg border border-gray-300 text-gray-700 text-xs font-bold"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg bg-green-800 text-white text-xs font-bold"
                >
                  {t('nav.createAccount')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
