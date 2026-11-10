'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import {
  SUPPORTED_LANGUAGES,
  translate,
  translateCategory,
  translateUnit,
  translateStatus,
  getLocaleCode,
} from '@/lib/i18n'

const STORAGE_KEY = 'uzhavar_lang'
const LANG_EVENT = 'uzhavar-lang-change'

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(LANG_EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(LANG_EVENT, handler)
  }
}

function getSnapshot() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved
    }
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
  return 'en'
}

function getServerSnapshot() {
  return 'en'
}

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key, vars) => translate('en', key, vars),
  tc: (name) => name,
  tu: (unit) => unit,
  ts: (status) => status,
  locale: 'en-IN',
})

export function LanguageProvider({ children }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLang(nextLang) {
    if (!SUPPORTED_LANGUAGES.includes(nextLang)) return
    try {
      localStorage.setItem(STORAGE_KEY, nextLang)
      document.documentElement.lang = nextLang
      window.dispatchEvent(new Event(LANG_EVENT))
    } catch {
      // Ignore storage errors
    }
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'ta' : 'en')
  }

  const value = {
    lang,
    setLang,
    toggleLang,
    t: (key, vars) => translate(lang, key, vars),
    tc: (name) => translateCategory(name, lang),
    tu: (unit) => translateUnit(unit, lang),
    ts: (status) => translateStatus(status, lang),
    locale: getLocaleCode(lang),
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
