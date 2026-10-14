'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ensureFarmerAccess } from '@/lib/farmerAuth'
import { setFlashToast } from '@/app/components/Toast'

export default function AuthCallback() {
  const router = useRouter()
  const [statusMessage, setStatusMessage] = useState('Verifying your email and logging in...')
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false

    async function processAuth() {
      try {
        if (typeof window === 'undefined') return

        const searchParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash || ''
        const hashParams = new URLSearchParams(
          hash.startsWith('#') ? hash.substring(1) : hash
        )

        // 1. Check for error in query or hash (e.g., expired token)
        const errParam = searchParams.get('error') || hashParams.get('error')
        const errDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description')

        // 2. Extract tokens from hash or search
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

        // 3. Extract PKCE code or token hash
        const code = searchParams.get('code') || hashParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
        const type = searchParams.get('type') || hashParams.get('type') || 'signup'
        const token = searchParams.get('token') || hashParams.get('token')
        const email = searchParams.get('email') || hashParams.get('email')

        let session = null

        // Flow A: Direct tokens in Hash/Search (Standard Supabase Implicit flow)
        if (accessToken && refreshToken) {
          setStatusMessage('Setting up your secure session...')
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!sessionErr && sessionData?.session) {
            session = sessionData.session
          }
        }

        // Flow B: PKCE authorization code exchange
        if (!session && code) {
          setStatusMessage('Exchanging verification code...')
          const { data: codeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!exchangeError && codeData?.session) {
            session = codeData.session
          } else if (exchangeError) {
            console.warn('exchangeCodeForSession notice:', exchangeError)
          }
        }

        // Flow C: Token Hash verification (OTP flow)
        if (!session && tokenHash) {
          setStatusMessage('Confirming verification token...')
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          })
          if (!otpError && otpData?.session) {
            session = otpData.session
          } else {
            // Fallback retry with 'email' type if 'signup' failed
            const { data: retryOtpData } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email',
            })
            if (retryOtpData?.session) {
              session = retryOtpData.session
            }
          }
        }

        // Flow D: Token + Email verification
        if (!session && token && email) {
          setStatusMessage('Verifying token...')
          const { data: tokenOtpData } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type,
          })
          if (tokenOtpData?.session) {
            session = tokenOtpData.session
          }
        }

        // Flow E: Check existing Supabase session in localStorage
        if (!session) {
          const { data: existingData } = await supabase.auth.getSession()
          session = existingData?.session
        }

        // Flow F: Quick listener wait in case client is resolving asynchronously
        if (!session && !errParam) {
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 2000)
            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, curSession) => {
              if (curSession) {
                session = curSession
                clearTimeout(timeout)
                subscription.unsubscribe()
                resolve()
              }
            })
          })
        }

        // 4. Get active user from session or client
        let currentUser = session?.user
        if (!currentUser) {
          const { data: userData } = await supabase.auth.getUser()
          currentUser = userData?.user
        }

        // Check if this is a password recovery flow!
        const isRecovery =
          type === 'recovery' ||
          searchParams.get('type') === 'recovery' ||
          hashParams.get('type') === 'recovery' ||
          searchParams.get('next')?.includes('reset-password') ||
          hash.includes('type=recovery')

        if (currentUser && isRecovery) {
          setStatusMessage('Redirecting to reset your password...')
          window.location.replace('/reset-password' + window.location.search + window.location.hash)
          return
        }

        // If user is already authenticated despite an error parameter (e.g. link clicked twice)
        if (currentUser) {
          setStatusMessage('Preparing Farmer Dashboard...')

          const roleFromQuery = searchParams.get('role') || hashParams.get('role')

          // Fetch or sync profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          const effectiveProfile = await ensureFarmerAccess(profile, currentUser, roleFromQuery)

          const isFarmer =
            effectiveProfile.role === 'farmer' ||
            currentUser.user_metadata?.role === 'farmer' ||
            roleFromQuery === 'farmer'

          if (isCancelled) return

          if (isFarmer) {
            setStatusMessage('Redirecting to Farmer Dashboard...')
            setFlashToast('Welcome to Uzhavar Market! Your email is verified and you are now logged in as Farmer. 🌾', 'success', 5000)
            window.location.replace('/farmer')
            return
          } else if (effectiveProfile.role === 'admin') {
            setStatusMessage('Redirecting to Admin Dashboard...')
            setFlashToast('Welcome Admin! You are logged in. ⚙️', 'success', 4000)
            window.location.replace('/admin')
            return
          } else {
            setStatusMessage('Redirecting to Customer Dashboard...')
            setFlashToast('Welcome to Uzhavar Market! Your account is verified. 🛒', 'success', 4000)
            window.location.replace('/customer')
            return
          }
        }

        // If we reach here and have an error parameter
        if (errParam) {
          setError(errDesc || errParam || 'Email verification link is invalid or expired.')
          return
        }

        // If no user could be verified
        setError('Could not verify session automatically. Please login with your registered email and password.')
      } catch (err) {
        console.error('Auth callback exception:', err)
        if (!isCancelled) {
          // As a safe fallback for farmers, check if we have an active session and redirect
          const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }))
          if (user) {
            setFlashToast('Welcome to Uzhavar Market! 🌾', 'success', 4000)
            window.location.replace('/farmer')
          } else {
            setError('Verification completed. Please login to enter your dashboard.')
          }
        }
      }
    }

    processAuth()

    return () => {
      isCancelled = true
    }
  }, [router])

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-lg text-center">
        <div className="text-2xl font-bold text-green-800 mb-6 flex items-center justify-center gap-2">
          <span>🌾</span>
          <span>Uzhavar Market</span>
        </div>

        {error ? (
          <div>
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Email Verification
            </h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full p-3 rounded-lg bg-green-800 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-xs"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Registration
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-4 animate-bounce">👨‍🌾</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome, Farmer!
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {statusMessage}
            </p>
            <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-gray-400">
              Opening your Farmer Dashboard automatically...
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
