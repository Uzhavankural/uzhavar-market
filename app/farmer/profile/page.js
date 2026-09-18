'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function FarmerProfile() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success') // 'success' | 'error'

  const [user, setUser] = useState(null)
  
  // Profile Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [village, setVillage] = useState('')
  const [district, setDistrict] = useState('')
  const [pincode, setPincode] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.replace('/login')
        return
      }

      setUser(authUser)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('PROFILE LOAD ERROR:', profileError)
        setMessage('Failed to load profile.')
        setMessageType('error')
        setLoading(false)
        return
      }

      if (profileData.role !== 'farmer') {
        router.replace('/login')
        return
      }

      setFullName(profileData.full_name || '')
      setPhone(profileData.phone || '')
      setEmail(profileData.email || authUser.email || '')
      setAddress(profileData.address || '')
      setVillage(profileData.village || '')
      setDistrict(profileData.district || '')
      setPincode(profileData.pincode || '')

    } catch (err) {
      console.error(err)
      setMessage('An unexpected error occurred.')
      setMessageType('error')
    }
    setLoading(false)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (!user) throw new Error('User not authenticated')

      const updates = {
        full_name: fullName,
        phone: phone,
        address: address,
        village: village,
        district: district,
        pincode: pincode
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message || JSON.stringify(error))
      }

      setMessage('Profile updated successfully! ✅')
      setMessageType('success')
    } catch (err) {
      console.error('PROFILE SAVE ERROR:', err)
      setMessage(`Error: ${err.message}. Please check if address, village, district, pincode columns exist in profiles table.`)
      setMessageType('error')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center font-sans">
        <p className="text-gray-500 text-lg animate-pulse">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans pb-10">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 py-4 px-4 sm:px-[6%] flex justify-between items-center flex-wrap gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/farmer')}
            className="text-gray-500 hover:text-green-800 transition-colors text-xl font-bold flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
          >
            &larr;
          </button>
          <div className="text-xl sm:text-2xl font-bold text-green-800">
            My Profile
          </div>
        </div>
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-4xl mx-auto pt-6 sm:pt-10">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200">
          
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="w-16 h-16 bg-green-100 text-green-800 flex items-center justify-center rounded-full text-3xl">
              👨‍🌾
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 m-0">Farm & Profile Details</h1>
              <p className="text-gray-500 text-sm mt-1 mb-0">Update your personal and farm location information</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Farmer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2">Farm Location / Address</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, House No, Landmark"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-y min-h-[80px]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Village / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="E.g., Perundurai"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="E.g., Erode"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    pattern="[0-9]{6}"
                    title="Please enter a valid 6-digit pincode"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push('/farmer')}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-lg bg-green-800 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[150px] shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </form>
        </div>
      </section>
    </main>
  )
}
