'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

   const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
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
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage(
      'Registration successful! Please check your email to confirm your account.'
    )

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
    <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center p-4 sm:p-8 font-sans">
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

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Create a password"
            required
            minLength={6}
            className="w-full p-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-600"
          />


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


        {message && (
          <p className="mt-5 text-center text-sm text-green-800 font-medium">
            {message}
          </p>
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