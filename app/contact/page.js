'use client'

import { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function ContactPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'customer',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    // Simulate query submission
    await new Promise((resolve) => setTimeout(resolve, 600))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar activePage="contact" />

      {/* HEADER HERO */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('contact.badge')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {t('contact.heroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed">
            {t('contact.heroDesc')}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 w-[92%] max-w-[1100px] mx-auto py-10 sm:py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CONTACT DETAILS CARDS (1 Col on LG) */}
          <div className="flex flex-col gap-5">
            
            {/* EMAIL SUPPORT CARD */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-800 rounded-xl shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider m-0">
                  {t('contact.emailTitle')}
                </h2>
                <a 
                  href="mailto:uzhavankural.3@gmail.com" 
                  className="text-base font-bold text-green-900 hover:text-green-700 hover:underline mt-1 mb-0.5 block break-all transition-colors"
                >
                  uzhavankural.3@gmail.com
                </a>
                <p className="text-xs text-gray-500 m-0">
                  {t('contact.emailSub')}
                </p>
              </div>
            </div>

            {/* DIGITAL DESK INFO */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider m-0">
                  {t('contact.hoursTitle')}
                </h2>
                <p className="text-sm font-bold text-gray-900 mt-1 mb-0.5">
                  {t('contact.hoursVal')}
                </p>
                <p className="text-xs text-gray-500 m-0 leading-relaxed">
                  {t('contact.hoursSub')}
                </p>
              </div>
            </div>

            {/* FARMER ONBOARDING ASSISTANCE */}
            <div className="bg-green-50 border border-green-200 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-green-950 m-0">
                  {t('contact.farmerTitle')}
                </h3>
              </div>
              <p className="text-xs text-green-900 leading-relaxed m-0">
                {t('contact.farmerDesc')}
              </p>
            </div>

            {/* NO SPAM NOTICE */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs text-gray-600 leading-relaxed">
              {t('contact.noSpamNotice')}
            </div>

          </div>

          {/* QUERY FORM (2 Cols on LG) */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-xs">
            
            {submitted ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('contact.thankYouTitle')}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                  {t('contact.thankYouDesc', { email: formData.email })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({
                      name: '',
                      email: '',
                      userType: 'customer',
                      subject: '',
                      message: '',
                    })
                  }}
                  className="px-6 py-2.5 rounded-xl bg-green-800 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {t('contact.formTitle')}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  {t('contact.formSubtitle')}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* USER TYPE SELECTION */}
                  <fieldset className="border border-gray-200 rounded-xl p-3.5 mb-4 bg-gray-50/50">
                    <legend className="text-xs font-bold text-gray-700 px-2 uppercase tracking-wider">
                      {t('contact.contactingAs')}
                    </legend>
                    <div className="flex gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
                        <input
                          type="radio"
                          name="userType"
                          value="customer"
                          checked={formData.userType === 'customer'}
                          onChange={handleChange}
                          className="accent-green-700 w-4 h-4"
                        />
                        <span>{t('contact.customerOpt')}</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800">
                        <input
                          type="radio"
                          name="userType"
                          value="farmer"
                          checked={formData.userType === 'farmer'}
                          onChange={handleChange}
                          className="accent-green-700 w-4 h-4"
                        />
                        <span>{t('contact.farmerOpt')}</span>
                      </label>
                    </div>
                  </fieldset>

                  {/* NAME & EMAIL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                        {t('contact.nameLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('contact.namePlaceholder')}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                        {t('contact.emailLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('contact.emailPlaceholder')}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                  </div>

                  {/* SUBJECT */}
                  <div>
                    <label htmlFor="subject" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      {t('contact.subjectLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contact.subjectPlaceholder')}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <label htmlFor="message" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      {t('contact.messageLabel')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('contact.messagePlaceholder')}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-green-800 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? t('contact.submitting') : t('contact.submitBtn')}
                  </button>

                </form>
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  )
}
