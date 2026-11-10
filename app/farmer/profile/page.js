'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'
import LanguageToggle from '@/app/components/LanguageToggle'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { showToast } from '../../components/Toast'
import { ensureFarmerAccess } from '../../../lib/farmerAuth'

export default function FarmerProfile() {
  const router = useRouter()
  const { t } = useLanguage()

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

      const effective = await ensureFarmerAccess(profileData, authUser)

      if (!effective.isAllowed && effective.role !== 'farmer') {
        router.replace('/login')
        return
      }

      setFullName(effective.full_name || '')
      setPhone(effective.phone || '')
      setEmail(effective.email || authUser.email || '')
      setAddress(effective.address || '')
      setVillage(effective.village || '')
      setDistrict(effective.district || '')
      setPincode(effective.pincode || '')

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
        id: user.id,
        full_name: fullName,
        phone: phone,
        address: address,
        village: village,
        district: district,
        pincode: pincode,
        role: 'farmer',
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })

      if (error) {
        throw new Error(error.message || JSON.stringify(error))
      }

      const successText = `${t('farmer.profileSavedMsg')} ✅`
      setMessage(successText)
      setMessageType('success')
      showToast(successText, 'success', 4000)
    } catch (err) {
      console.error('PROFILE SAVE ERROR:', err)
      const errText = `Error: ${err.message}`
      setMessage(errText)
      setMessageType('error')
      showToast(errText, 'error', 4000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex justify-center items-center font-sans">
        <p className="text-gray-500 text-lg animate-pulse">{t('profile.loadingProfile')}</p>
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
            {t('farmer.myProfile')}
          </div>
        </div>
        <LanguageToggle variant="compact" />
      </nav>

      <section className="w-[95%] sm:w-[90%] max-w-4xl mx-auto pt-6 sm:pt-10">
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200">
          
          <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
            <div className="w-16 h-16 bg-green-100 text-green-800 flex items-center justify-center rounded-full text-3xl">
              👨‍🌾
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 m-0">{t('farmer.farmProfileTitle')}</h1>
              <p className="text-gray-500 text-sm mt-1 mb-0">{t('farmer.farmProfileSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2">
                {t('farmer.personalInfoSection')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('farmer.farmerNameLabel')}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.fullNamePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('farmer.mobileNumberLabel')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('auth.phonePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('farmer.emailOptionalLabel')} <span className="text-gray-400 font-normal">{t('farmer.optionalTag')}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-50 pb-2">
                {t('farmer.farmLocationSection')}
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('auth.addressLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('auth.addressPlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-y min-h-[80px]"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.villageLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={t('auth.villagePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.districtLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={t('auth.districtPlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('auth.pincodeLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder={t('auth.pincodePlaceholder')}
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
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-lg bg-green-800 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[150px] shadow-sm"
              >
                {saving ? t('profile.saving') : t('farmer.saveProfileBtn')}
              </button>
            </div>

          </form>
        </div>
      </section>
    </main>
  )
}
