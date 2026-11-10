'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ensureFarmerAccess } from '@/lib/farmerAuth'
import { setFlashToast } from '@/app/components/Toast'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'

export default function AuthCallback() {
  const router = useRouter()
  const { t } = useLanguage()
  const [statusMessage, setStatusMessage] = useState('')
  const [detectedRole, setDetectedRole] = useState('')
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

        const roleFromQuery = searchParams.get('role') || hashParams.get('role')
        if (roleFromQuery) {
          setDetectedRole(roleFromQuery)
        }

        const errParam = searchParams.get('error') || hashParams.get('error')
        const errDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description')

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')
        const code = searchParams.get('code') || hashParams.get('code')
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash')
        const type = searchParams.get('type') || hashParams.get('type') || 'signup'
        const token = searchParams.get('token') || hashParams.get('token')
        const email = searchParams.get('email') || hashParams.get('email')

        let session = null

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!sessionErr && sessionData?.session) {
            session = sessionData.session
          }
        }

        if (!session && code) {
          const { data: codeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!exchangeError && codeData?.session) {
            session = codeData.session
          } else if (exchangeError) {
            console.warn('exchangeCodeForSession notice:', exchangeError)
          }
        }

        if (!session && tokenHash) {
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          })
          if (!otpError && otpData?.session) {
            session = otpData.session
          } else {
            const { data: retryOtpData } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email',
            })
            if (retryOtpData?.session) {
              session = retryOtpData.session
            }
          }
        }

        if (!session && token && email) {
          const { data: tokenOtpData } = await supabase.auth.verifyOtp({
            email,
            token,
            type: type,
          })
          if (tokenOtpData?.session) {
            session = tokenOtpData.session
          }
        }

        if (!session) {
          const { data: existingData } = await supabase.auth.getSession()
          session = existingData?.session
        }

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

        let currentUser = session?.user
        if (!currentUser) {
          const { data: userData } = await supabase.auth.getUser()
          currentUser = userData?.user
        }

        const isRecovery =
          type === 'recovery' ||
          searchParams.get('type') === 'recovery' ||
          hashParams.get('type') === 'recovery' ||
          searchParams.get('next')?.includes('reset-password') ||
          hash.includes('type=recovery')

        if (currentUser && isRecovery) {
          window.location.replace('/reset-password' + window.location.search + window.location.hash)
          return
        }

        if (currentUser) {
          const roleHint = roleFromQuery || currentUser.user_metadata?.role

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          const effectiveProfile = await ensureFarmerAccess(profile, currentUser, roleHint)
          const targetRole = effectiveProfile?.role || roleHint || 'customer'
          setDetectedRole(targetRole)

          if (isCancelled) return

          if (targetRole === 'farmer') {
            setStatusMessage(t('auth.openingFarmerDash'))
            setFlashToast(`${t('auth.welcomeFarmer')} 🌾`, 'success', 5000)
            window.location.replace('/farmer')
            return
          } else if (targetRole === 'admin') {
            setStatusMessage(t('auth.openingDash'))
            setFlashToast(`${t('nav.adminDashboard')} ⚙️`, 'success', 4000)
            window.location.replace('/admin')
            return
          } else {
            setStatusMessage(t('auth.openingCustomerDash'))
            setFlashToast(`${t('auth.welcomeCustomer')} 🛒`, 'success', 4000)
            window.location.replace('/customer')
            return
          }
        }

        if (errParam) {
          setError(errDesc || errParam || 'Email verification link is invalid or expired.')
          return
        }

        setError('Could not verify session automatically. Please login with your registered email and password.')
      } catch (err) {
        console.error('Auth callback exception:', err)
        if (!isCancelled) {
          const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }))
          if (user) {
            const role = user.user_metadata?.role || 'customer'
            if (role === 'farmer') {
              setFlashToast(`${t('brand')} 🌾`, 'success', 4000)
              window.location.replace('/farmer')
            } else if (role === 'admin') {
              window.location.replace('/admin')
            } else {
              setFlashToast(`${t('brand')} 🛒`, 'success', 4000)
              window.location.replace('/customer')
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-lg text-center">
        <div className="flex justify-end mb-3">
          <LanguageToggle variant="compact" />
        </div>
        <div className="text-2xl font-bold text-green-800 mb-6 flex items-center justify-center gap-2">
          <span>🌾</span>
          <span>{t('brand')}</span>
        </div>

        {error ? (
          <div>
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              {t('auth.emailVerificationTitle')}
            </h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full p-3 rounded-lg bg-green-800 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-xs"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => router.push('/register')}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('auth.backToRegistration')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-4 animate-bounce">
              {detectedRole === 'farmer' ? '👨‍🌾' : detectedRole === 'customer' ? '🛒' : '🌾'}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {detectedRole === 'farmer'
                ? t('auth.welcomeFarmer')
                : detectedRole === 'customer'
                ? t('auth.welcomeCustomer')
                : t('auth.welcomeDefault')}
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {statusMessage || t('auth.verifyingEmailSetup')}
            </p>
            <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-gray-400">
              {detectedRole === 'farmer'
                ? t('auth.openingFarmerDash')
                : detectedRole === 'customer'
                ? t('auth.openingCustomerDash')
                : t('auth.openingDash')}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
