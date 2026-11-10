'use client'

import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function GuidelinesContent() {
  const { t } = useLanguage()
  const farmersList = t('guidelines.farmersList')
  const consumersList = t('guidelines.consumersList')
  const zeroList = t('guidelines.zeroList')

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5] text-gray-800">
      <Navbar activePage="guidelines" />

      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-12 sm:py-16 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('guidelines.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {t('guidelines.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed">
            {t('guidelines.subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('guidelines.s1Title')}</h2>
            <p>{t('guidelines.s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-green-800 mb-3">
              {t('guidelines.farmersTitle')}
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              {Array.isArray(farmersList) &&
                farmersList.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-green-800 mb-3">
              {t('guidelines.consumersTitle')}
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              {Array.isArray(consumersList) &&
                consumersList.map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-gray-900">{item.bold}</strong> {item.text}
                  </li>
                ))}
            </ul>
          </section>

          <section className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-800 mb-2">{t('guidelines.zeroTitle')}</h2>
            <p className="text-sm text-red-900 mb-3">{t('guidelines.zeroIntro')}</p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-red-900">
              {Array.isArray(zeroList) && zeroList.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <div className="bg-green-900 text-white rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">{t('guidelines.ctaTitle')}</h3>
              <p className="text-xs sm:text-sm text-green-200 mt-0.5">{t('guidelines.ctaSub')}</p>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-white text-green-900 font-semibold text-sm hover:bg-green-50 transition whitespace-nowrap"
            >
              {t('guidelines.reportBtn')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
