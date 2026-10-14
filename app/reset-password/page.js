'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { showToast, setFlashToast } from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyingSession, setVerifyingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  // Initialize recovery session from URL parameters (Hash / Code / Token Hash)
  useEffect(() => {
    let isCancelled = false

    async function initRecoverySession() {
      try {
        if (typeof window === 'undefined') return

        const searchParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash || ''
        const hashParams = new URLSearchParams(
          hash.startsWith('#') ? hash.substring(1) : hash
        )

        // 1. Check for error in query or hash
        const errParam = searchParams.get('error') || hashParams.get('error')
        const errDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description')

        // 2. Extract tokens from hash or search
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
        const code = searchParams.get('code') || hashParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')

        // Set session if access_token in hash
        if (accessToken && refreshToken) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!sessionErr) {
            if (!isCancelled) {
              setHasValidSession(true)
              setVerifyingSession(false)
            }
            return
          }
        }

        // Exchange code if PKCE
        if (code) {
          const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code)
          if (!codeErr) {
            if (!isCancelled) {
              setHasValidSession(true)
              setVerifyingSession(false)
            }
            return
          }
        }

        // Verify token_hash if OTP
        if (tokenHash) {
          const { error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
          if (!otpErr) {
            if (!isCancelled) {
              setHasValidSession(true)
              setVerifyingSession(false)
            }
            return
          }
        }

        // Check if there's an already active session
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          if (!isCancelled) {
            setHasValidSession(true)
            setVerifyingSession(false)
          }
          return
        }

        // If error param exists and no session
        if (errParam) {
          if (!isCancelled) {
            setErrorNotice(errDesc || errParam || 'Password reset link is invalid or has expired.')
            setVerifyingSession(false)
          }
          return
        }

        // Give Supabase a short moment to parse hash internally
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
            if (!isCancelled) {
              setHasValidSession(true)
              setVerifyingSession(false)
            }
          }
        })

        setTimeout(() => {
          if (!isCancelled) {
            setVerifyingSession(false)
            subscription.unsubscribe()
          }
        }, 1500)
      } catch (err) {
        console.warn('Session init notice:', err)
        if (!isCancelled) {
          setVerifyingSession(false)
        }
      }
    }

    initRecoverySession()

    return () => {
      isCancelled = true
    }
  }, [])

  async function handleChangePassword(e) {
    e.preventDefault()

    setMessage('')

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters.'
      setMessage(msg)
      showToast(msg, 'error')
      return
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
    if (!passwordRegex.test(password)) {
      const msg = 'Password must contain at least one uppercase letter, one number, and one special character.'
      setMessage(msg)
      showToast(msg, 'error')
      return
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please verify your new password.'
      setMessage(msg)
      showToast(msg, 'error')
      return
    }

    setLoading(true)

    try {
      const { data: updateData, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setMessage(error.message)
        showToast(error.message, 'error')
        setLoading(false)
        return
      }

      const successMsg = 'Password changed successfully! Logging you in...'
      setMessage(successMsg)
      showToast(successMsg, 'success', 4000)
      setFlashToast('Your password was updated successfully! Welcome back. ✅', 'success', 5000)

      setPassword('')
      setConfirmPassword('')

      // Identify user role to redirect directly to their dashboard
      const user = updateData?.user || (await supabase.auth.getUser()).data?.user
      let targetPath = '/customer'

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role || user.user_metadata?.role

        if (role === 'farmer') {
          targetPath = '/farmer'
        } else if (role === 'admin') {
          targetPath = '/admin'
        }
      }

      setTimeout(() => {
        window.location.replace(targetPath)
      }, 1000)
    } catch (err) {
      console.error('Update password exception:', err)
      const errMsg = err.message || 'Failed to update password. Please try again.'
      setMessage(errMsg)
      showToast(errMsg, 'error')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-lg">
        <div className="text-center text-xl sm:text-2xl font-bold text-green-800 mb-6 flex items-center justify-center gap-2">
          <span>🌾</span>
          <span>Uzhavar Market</span>
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-semibold text-gray-800 mb-2">
          Reset Password
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm leading-relaxed">
          Create and confirm your new password below.
        </p>

        {errorNotice ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-sm text-red-700 font-medium mb-4 leading-relaxed">
              {errorNotice}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="w-full p-2.5 rounded-lg bg-green-800 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Request New Reset Link
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : verifyingSession ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Verifying secure reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword}>
            {/* New Password */}
            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
              New Password
            </label>

            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
                className="w-full h-12 px-3.5 pr-11 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-toggle-btn absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center cursor-pointer bg-transparent border-0 outline-none text-gray-400 hover:text-green-800 transition-colors z-10"
                style={{ top: 0, bottom: 0, right: 0, transform: 'none' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-green-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
              Confirm Password
            </label>

            <div className="relative w-full">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                className="w-full h-12 px-3.5 pr-11 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="eye-toggle-btn absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center cursor-pointer bg-transparent border-0 outline-none text-gray-400 hover:text-green-800 transition-colors z-10"
                style={{ top: 0, bottom: 0, right: 0, transform: 'none' }}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-green-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Must be at least 6 characters with 1 uppercase letter, 1 number & 1 special character.
            </p>

            {/* Change Password Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3.5 mt-6 rounded-lg bg-green-800 text-white text-base font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 cursor-pointer"
            >
              {loading ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        )}

        {message && (
          <p className={`mt-5 text-center text-sm font-medium ${message.includes('successfully') ? 'text-green-800' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          <a
            href="/login"
            className="text-green-800 font-semibold hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </main>
  )
}