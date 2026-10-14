'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'

export default function ForgotPassword() {
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
        ? 'Email sending limit reached! Supabase free default allows only a few emails per hour. Please wait a few minutes before trying again or configure Custom SMTP in Supabase.'
        : error.message

      setMessage({ text: displayError, isError: true })
      showToast(displayError, 'error', 6000)
      setLoading(false)
      return
    }

    const successMsg = 'Password reset link sent! Please check your email to set a new password.'
    setMessage({ text: successMsg, isError: false })
    showToast(successMsg, 'success', 5000)
    setEmail('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg">
        <div className="text-center text-xl sm:text-2xl font-bold text-green-800 mb-6">🌾 Uzhavar Market</div>

        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">Forgot Password?</h1>

        <p className="text-center text-gray-500 mb-8 leading-relaxed">
          Enter your email and we will send you a password reset link.
        </p>

        <form onSubmit={handleReset}>
          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 mt-6 rounded-lg bg-green-800 text-white text-base font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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
          Remember your password?{' '}
          <a href="/login" className="text-green-800 font-semibold hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </main>
  )
}