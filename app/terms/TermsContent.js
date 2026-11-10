'use client'

import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function TermsContent() {
  const { t } = useLanguage()
  const s3Items = t('terms.s3Items')
  const s4Items = t('terms.s4Items')
  const s5Items = t('terms.s5Items')

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5] text-gray-800">
      <Navbar />

      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-12 sm:py-16 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('terms.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {t('terms.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed">
            {t('terms.subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s1Title')}</h2>
            <p>{t('terms.s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s2Title')}</h2>
            <p>{t('terms.s2Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s3Title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s3Items) &&
                s3Items.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s4Title')}</h2>
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
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s5Title')}</h2>
            <p className="mb-3">{t('terms.s5Intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s5Items) &&
                s5Items.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s6Title')}</h2>
            <p>{t('terms.s6Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('terms.s7Title')}</h2>
            <p>{t('terms.s7Body')}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
