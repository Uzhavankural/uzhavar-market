'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Password reset link sent! Please check your email.')
    setEmail('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans">
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

        {message && (
          <p className="mt-5 text-center text-sm text-green-800 font-medium">
            {message}
          </p>
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