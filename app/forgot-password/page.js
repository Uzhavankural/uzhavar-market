'use client'

import { useState } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'
import { supabase } from '../../lib/supabase'
import { showToast } from '../components/Toast'

export default function ForgotPassword() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : 'http://localhost:3000/reset-password'

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (error) {
      const isRateLimit =
        error.status === 429 ||
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('over_email_send_rate_limit')

      const displayError = isRateLimit
        ? t('auth.rateLimitErr')
        : error.message

      setMessage({ text: displayError, isError: true })
      showToast(displayError, 'error', 6000)
      setLoading(false)
      return
    }

    const successMsg = t('auth.resetLinkSent')
    setMessage({ text: successMsg, isError: false })
    showToast(successMsg, 'success', 5000)
    setEmail('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans relative">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg">
        <div className="flex justify-end mb-4">
          <LanguageToggle variant="compact" />
        </div>
        <div className="text-center text-xl sm:text-2xl font-bold text-green-800 mb-6">🌾 {t('brand')}</div>

        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">{t('auth.forgotTitle')}</h1>

        <p className="text-center text-gray-500 mb-8 leading-relaxed">
          {t('auth.forgotDesc')}
        </p>

        <form onSubmit={handleReset}>
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">{t('auth.emailLabel')}</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 mt-6 rounded-lg bg-green-800 text-white text-base font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>

        {message?.text && (
          <div
            className={`mt-5 p-3 rounded-lg text-center text-sm font-medium ${
              message.isError
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          {t('auth.rememberPassword')}{' '}
          <a href="/login" className="text-green-800 font-semibold hover:underline">
            {t('auth.backToLogin')}
          </a>
        </p>
      </div>
    </main>
  )
}