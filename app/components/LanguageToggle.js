'use client'

import { useLanguage } from '@/app/context/LanguageContext'

export default function LanguageToggle({ variant = 'default', className = '' }) {
  const { lang, setLang, t } = useLanguage()

  const isDarkSurface = variant === 'dark'
  const isCompact = variant === 'compact'

  const containerClasses = isDarkSurface
    ? 'inline-flex items-center bg-green-950/90 border border-green-700/70 rounded-lg p-0.5 text-xs shrink-0'
    : 'inline-flex items-center bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-0.5 text-xs shrink-0'

  const activeBtnClasses = isDarkSurface
    ? 'bg-green-700 text-white shadow-2xs'
    : 'bg-green-800 dark:bg-emerald-600 text-white shadow-2xs'

  const inactiveBtnClasses = isDarkSurface
    ? 'bg-transparent text-gray-300 hover:text-white'
    : 'bg-transparent text-gray-700 dark:text-slate-300 hover:text-green-900 dark:hover:text-white'

  const padClasses = isCompact ? 'px-1.5 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={`${containerClasses} ${className}`.trim()}
    >
      {!isCompact && (
        <span
          aria-hidden="true"
          className={`pl-1.5 pr-1 flex items-center ${
            isDarkSurface ? 'text-green-300' : 'text-green-800 dark:text-emerald-400'
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9 9 0 100-18 9 9 0 000 18z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18"
            />
          </svg>
        </span>
      )}

      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label={t('language.switchToEnglish')}
        className={`${padClasses} rounded-md font-bold transition-colors cursor-pointer border-none ${
          lang === 'en' ? activeBtnClasses : inactiveBtnClasses
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLang('ta')}
        aria-pressed={lang === 'ta'}
        aria-label={t('language.switchToTamil')}
        className={`${padClasses} rounded-md font-bold transition-colors cursor-pointer border-none whitespace-nowrap ${
          lang === 'ta' ? activeBtnClasses : inactiveBtnClasses
        }`}
      >
        தமிழ்
      </button>
    </div>
  )
}
