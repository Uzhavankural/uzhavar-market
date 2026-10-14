'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { showToast } from '../components/Toast'
import ThemeToggle from '../components/ThemeToggle'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('customer')
  const [address, setAddress] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [pincode, setPincode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/
    if (!passwordRegex.test(password)) {
      const pwdMsg = 'Password must contain at least one uppercase letter, one number, and one special character.'
      setMessage({ text: pwdMsg, isError: true })
      showToast(pwdMsg, 'error')
      setLoading(false)
      return
    }


    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`
      : undefined

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
          address: role === 'farmer' ? address : null,
          village: role === 'farmer' ? village : null,
          district: role === 'farmer' ? district : null,
          pincode: role === 'farmer' ? pincode : null,
        },
      },
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

    const successMsg =
      role === 'farmer'
        ? 'Registration successful! Please check your email and click the confirm mail link to directly open your Farmer Dashboard.'
        : 'Registration successful! Please check your email to confirm your account.'

    setMessage({ text: successMsg, isError: false })
    showToast(successMsg, 'success', 5000)

    setFullName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setAddress('')
    setVillage('')
    setDistrict('')
    setPincode('')
    setLoading(false)
  }

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
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Join Uzhavar Market
        </p>

        <form onSubmit={handleRegister}>

          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
            placeholder="Enter your full name"
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />


          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Phone Number
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            placeholder="Enter your phone number"
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />


          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
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
              placeholder="Create a password"
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

            <p className="text-xs text-gray-500 mt-1">
              Password must contain at least one uppercase letter, one number, and one special character.
            </p>



          <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
            Account Type
          </label>

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
          >
            <option value="customer">
              Customer
            </option>

            <option value="farmer">
              Farmer
            </option>
          </select>

          {role === 'farmer' && (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, House No, Landmark"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                Village / Town
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="E.g., Perundurai"
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="E.g., Erode"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    required
                    pattern="[0-9]{6}"
                    className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
              </div>
            </>
          )}


          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 mt-6 rounded-lg bg-green-800 text-white text-base font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
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
          Already have an account?{' '}

          <a
            href="/login"
            className="text-green-800 font-semibold hover:underline"
          >
            Login
          </a>
        </p>

      </div>
    </main>
  )
}