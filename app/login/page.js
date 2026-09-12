'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('PROFILE ERROR:', profileError)
      setMessage('Profile not found.')
      setLoading(false)
      return
    }

    setMessage('Login successful!')

    setEmail('')
    setPassword('')
    setLoading(false)

      if (profile.role === 'admin') {
        router.push('/admin')
      } else if (profile.role === 'farmer') {
        router.push('/farmer')
      } else if (profile.role === 'customer') {
        router.push('/customer')
      } else {
        setMessage('Invalid user role.')
      }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg">

        <div className="text-center text-xl sm:text-2xl font-bold text-green-800 mb-6">
          🌾 Uzhavar Market
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Password
          </label>

          {/* Password Input with Eye Button */}
          <div className="relative w-full">

            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lg p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>

          </div>

          <p className="text-right mt-2 mb-1 text-sm">
            <a
              href="/forgot-password"
              className="text-green-800 font-semibold hover:underline"
            >
              Forgot Password?
            </a>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 mt-5 rounded-lg bg-green-800 text-white text-base font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm text-green-800 font-medium">
            {message}
          </p>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have an account?{' '}

          <a
            href="/register"
            className="text-green-800 font-semibold hover:underline"
          >
            Create Account
          </a>
        </p>

      </div>
    </main>
  )
}