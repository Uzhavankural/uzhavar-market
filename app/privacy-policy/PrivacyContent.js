'use client'

import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function PrivacyContent() {
  const { t } = useLanguage()
  const s2Items = t('privacy.s2Items')
  const s3Items = t('privacy.s3Items')
  const s4Items = t('privacy.s4Items')
  const s6Items = t('privacy.s6Items')

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5] text-gray-800">
      <Navbar />

      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-12 sm:py-16 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('privacy.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {t('privacy.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed">
            {t('privacy.subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s1Title')}</h2>
            <p>{t('privacy.s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s2Title')}</h2>
            <p className="mb-3">{t('privacy.s2Intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s2Items) &&
                s2Items.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s3Title')}</h2>
            <p className="mb-3">{t('privacy.s3Intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s3Items) && s3Items.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s4Title')}</h2>
            <p className="mb-3">
              <strong className="text-gray-900">{t('privacy.s4IntroBold')}</strong>
              {t('privacy.s4IntroRest')}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s4Items) &&
                s4Items.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s5Title')}</h2>
            <p>{t('privacy.s5Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s6Title')}</h2>
            <p className="mb-3">{t('privacy.s6Intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s6Items) && s6Items.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('privacy.s7Title')}</h2>
            <p className="mb-4">{t('privacy.s7Intro')}</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-1.5 text-sm">
              <p className="font-bold text-green-900">{t('privacy.deskTitle')}</p>
              <p className="text-gray-700">{t('privacy.deskLocation')}</p>
              <p className="text-green-800 font-semibold">{t('privacy.deskEmail')}</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
