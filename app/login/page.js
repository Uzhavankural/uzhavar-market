'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { ensureFarmerAccess } from '../../lib/farmerAuth'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Banned Farmer Appeal States
  const [bannedUser, setBannedUser] = useState(null)
  const [bannedProfile, setBannedProfile] = useState(null)
  const [appealReason, setAppealReason] = useState('')
  const [voiceFile, setVoiceFile] = useState(null)
  const [voicePreview, setVoicePreview] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [submittingAppeal, setSubmittingAppeal] = useState(false)

  const [resending, setResending] = useState(false)
  const [showResend, setShowResend] = useState(false)

  // Redirect if already logged in or arriving from email verification
  useEffect(() => {
    async function checkExistingAuth() {
      if (typeof window === 'undefined') return
      const hash = window.location.hash || ''
      const search = window.location.search || ''

      if (
        hash.includes('type=recovery') ||
        search.includes('type=recovery')
      ) {
        router.replace('/reset-password' + search + hash)
        return
      }

      if (
        hash.includes('access_token') ||
        search.includes('code=') ||
        search.includes('token_hash=') ||
        hash.includes('token_hash=') ||
        search.includes('token=') ||
        search.includes('type=signup') ||
        hash.includes('type=signup')
      ) {
        router.replace('/auth/callback' + search + hash)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const effective = await ensureFarmerAccess(profile, user)
        if (effective.role === 'farmer' || user.user_metadata?.role === 'farmer') {
          router.replace('/farmer')
        } else if (effective.role === 'admin') {
          router.replace('/admin')
        }
      }
    }
    checkExistingAuth()
  }, [router])

  // Live timer for voice recording
  useEffect(() => {
    let interval = null
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 120) {
            stopRecording()
            return 120
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, mediaRecorder])

  async function handleResendConfirmation() {
    if (!email) {
      alert('Please enter your email address above to resend confirmation email.')
      return
    }
    setResending(true)
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?role=farmer`,
      },
    })
    setResending(false)
    if (resendErr) {
      alert('Could not resend email: ' + resendErr.message)
    } else {
      alert('Confirmation email sent! Please check your inbox and click the confirm mail link.')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()

    setMessage('')
    setShowResend(false)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('Your email is not confirmed yet. Please check your inbox and click the confirmation link.')
        setShowResend(true)
      } else {
        setMessage(error.message)
      }
      setLoading(false)
      return
    }

    const user = data.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const effectiveProfile = await ensureFarmerAccess(profile, user)

    if (effectiveProfile.is_banned) {
      setBannedUser(user)
      setBannedProfile(effectiveProfile)
      setLoading(false)
      return
    }

    setMessage('Login successful!')

    setEmail('')
    setPassword('')
    setLoading(false)

    if (effectiveProfile.role === 'farmer' || user.user_metadata?.role === 'farmer') {
      router.push('/farmer')
    } else if (effectiveProfile.role === 'admin') {
      router.push('/admin')
    } else if (effectiveProfile.role === 'customer') {
      router.push('/customer')
    } else {
      router.push('/farmer')
    }
  }

  // Audio Recording Handlers
  async function startRecording() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported on your browser. Please upload an audio file instead.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setVoiceFile(blob)
        setVoicePreview(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingSeconds(0)
    } catch (err) {
      console.error('Microphone error:', err)
      alert('Microphone access denied or not available. You can upload an audio file instead.')
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  function handleVoiceFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setVoiceFile(file)
    setVoicePreview(url)
  }

  function removeVoiceNote() {
    if (voicePreview) {
      try {
        URL.revokeObjectURL(voicePreview)
      } catch (e) {}
    }
    setVoiceFile(null)
    setVoicePreview(null)
    const fileInput = document.getElementById('voice-file-input')
    if (fileInput) fileInput.value = ''
  }

  async function handleSubmitAppeal(e) {
    e.preventDefault()
    if (!appealReason.trim()) {
      alert('Please enter your reason for the appeal.')
      return
    }

    setSubmittingAppeal(true)

    try {
      let voiceUrl = null

      if (voiceFile) {
        const ext = voiceFile.name ? (voiceFile.name.split('.').pop() || 'webm') : 'webm'
        const fileName = `appeal-voice-${bannedUser.id}-${Date.now()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, voiceFile)

        if (uploadErr) {
          console.warn('Voice upload error:', uploadErr)
        } else {
          const { data: pubData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)
          voiceUrl = pubData.publicUrl
        }
      }

      const appealData = {
        reason: appealReason.trim(),
        voice_url: voiceUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      const { error: appealErr } = await supabase
        .from('profiles')
        .update({ appeal: appealData })
        .eq('id', bannedUser.id)

      if (appealErr) {
        if (appealErr.message && appealErr.message.includes('appeal')) {
          alert('Database note: Please run the SQL command in Supabase: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS appeal JSONB;')
        }
        throw appealErr
      }

      setBannedProfile((prev) => ({
        ...prev,
        appeal: appealData,
      }))
      alert('Appeal submitted successfully! Admin will review your appeal.')
    } catch (err) {
      console.error('Submit appeal error:', err)
      alert('Failed to submit appeal: ' + err.message)
    } finally {
      setSubmittingAppeal(false)
    }
  }

  async function handleBannedLogout() {
    await supabase.auth.signOut()
    setBannedUser(null)
    setBannedProfile(null)
    setMessage('')
    setVoiceFile(null)
    setVoicePreview(null)
    setAppealReason('')
  }

  // ==========================================
  // RENDER BANNED / APPEAL VIEW
  // ==========================================
  if (bannedProfile) {
    const hasPendingAppeal = bannedProfile.appeal && bannedProfile.appeal.status === 'pending'
    const hasRejectedAppeal = bannedProfile.appeal && bannedProfile.appeal.status === 'rejected'

    return (
      <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans">
        <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-xl">
          <div className="text-center text-4xl mb-3">🛑</div>
          <h1 className="text-center text-2xl font-bold text-red-700 mb-1">
            Account Suspended
          </h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            Hello <span className="font-bold text-gray-800">{bannedProfile.full_name || 'Farmer'}</span>, your account has been removed by the Admin.
          </p>

          {/* Pending Appeal View */}
          {hasPendingAppeal ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <h3 className="m-0 text-base font-bold text-amber-900 mb-1">Appeal Under Review</h3>
              <p className="m-0 text-xs text-amber-800 leading-relaxed mb-4">
                Your appeal was submitted on{' '}
                <strong className="font-bold">
                  {new Date(bannedProfile.appeal.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
                . The Admin will review your appeal. Once accepted, your account and products will be reactivated automatically.
              </p>

              <div className="bg-white/90 p-4 rounded-lg text-left text-xs text-gray-700 border border-amber-100 shadow-sm">
                <span className="block font-bold text-gray-500 uppercase text-[10px] mb-1">Your Stated Reason:</span>
                <p className="m-0 text-sm text-gray-800 italic leading-relaxed">"{bannedProfile.appeal.reason}"</p>
                {bannedProfile.appeal.voice_url && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="block font-bold text-gray-500 uppercase text-[10px] mb-1">Attached Voice Note:</span>
                    <audio controls src={bannedProfile.appeal.voice_url} className="w-full mt-1" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Appeal Submission Form */
            <form onSubmit={handleSubmitAppeal} className="flex flex-col gap-4 mb-6">
              {hasRejectedAppeal && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 leading-relaxed">
                  <strong className="block font-bold mb-0.5">✕ Previous Appeal Rejected</strong>
                  Admin reviewed and rejected your previous appeal. You may submit a new appeal with additional clarification and a voice note below.
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800">
                💡 <span className="font-semibold">Submit an Appeal:</span> Explain why your account should be reactivated. You can also record or attach a voice note for the Admin.
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Appeal Reason *
                </label>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Explain why your account was removed and why it should be reactivated..."
                  rows={4}
                  required
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-y"
                />
              </div>

              {/* Voice Note Section */}
              <div className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Voice Note (Optional)
                </label>
                <p className="text-[11px] text-gray-500 mb-3">
                  Record your explanation (up to 2 minutes) or upload an audio file.
                </p>

                {voicePreview ? (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Audio Preview:</span>
                      <button
                        type="button"
                        onClick={removeVoiceNote}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <audio controls src={voicePreview} className="w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm animate-pulse"
                        >
                          <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                          Stop Recording ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800 shadow-sm transition-colors"
                        >
                          <span>🎙️</span> Record Voice Note
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-[10px] uppercase font-bold text-gray-400">OR</span>
                      <input
                        id="voice-file-input"
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceFileUpload}
                        className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingAppeal}
                className="w-full p-3 rounded-xl bg-green-800 text-white text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md mt-1"
              >
                {submittingAppeal ? 'Submitting Appeal...' : '✉️ Submit Appeal'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <button
              type="button"
              onClick={handleBannedLogout}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors py-1 px-3 rounded hover:bg-gray-100"
            >
              ← Back to Login / Log Out
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ==========================================
  // STANDARD LOGIN VIEW
  // ==========================================
  return (
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

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
                /* Eye Slash (Hide Password) */
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
                /* Eye (Show Password) */
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

        {showResend && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Sending Email...' : '✉️ Resend Confirmation Email'}
            </button>
          </div>
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