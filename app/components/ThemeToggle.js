'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '', compact = false }) {
  const [theme, setTheme] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    function syncTheme() {
      const isDark = document.documentElement.classList.contains('dark')
      setTheme(isDark ? 'dark' : 'light')
    }

    // Initial check
    syncTheme()

    // Listen for theme changes across components and storage
    window.addEventListener('uzhavar-theme-changed', syncTheme)
    window.addEventListener('storage', syncTheme)

    return () => {
      window.removeEventListener('uzhavar-theme-changed', syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  function toggleTheme() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    const nextTheme = isCurrentlyDark ? 'light' : 'dark'

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      try {
        localStorage.setItem('uzhavar_theme', 'dark')
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
      try {
        localStorage.setItem('uzhavar_theme', 'light')
      } catch (e) {}
    }

    setTheme(nextTheme)
    window.dispatchEvent(new Event('uzhavar-theme-changed'))
  }

  // Prevent hydration layout shift
  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-lg border border-transparent opacity-0 ${className}`}
        aria-hidden="true"
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center gap-1.5 ${
        compact ? 'p-1.5 sm:px-2.5 sm:py-1.5' : 'px-2.5 py-1.5 sm:px-3'
      } rounded-lg border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 shrink-0 ${
        isDark
          ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600 shadow-xs'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900 shadow-xs'
      } ${className}`}
    >
      {isDark ? (
        <>
          {/* Sun icon */}
          <svg
            className="w-4 h-4 text-amber-400 shrink-0 transition-transform duration-300 rotate-0 hover:rotate-45"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {!compact && <span className="hidden sm:inline">Light</span>}
        </>
      ) : (
        <>
          {/* Moon icon */}
          <svg
            className="w-4 h-4 text-slate-700 shrink-0 transition-transform duration-300 rotate-0 hover:-rotate-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          {!compact && <span className="hidden sm:inline">Dark</span>}
        </>
      )}
    </button>
  )
}
