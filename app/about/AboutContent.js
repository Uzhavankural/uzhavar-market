'use client'

import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function AboutContent() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5] text-gray-800">
      <Navbar activePage="about" />

      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('about.badge')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            {t('about.heroTitle1')}
            <br />
            <span className="text-green-300">{t('about.heroTitle2')}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-2xl mx-auto leading-relaxed">
            {t('about.heroDesc')}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('about.problemTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {t('about.problemDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-red-700 mb-4">
                {t('about.traditionalTitle')}
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{t('about.trad1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{t('about.trad2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{t('about.trad3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>{t('about.trad4')}</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-green-300 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-green-800 mb-4">
                {t('about.directTitle')}
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{t('about.dir1')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{t('about.dir2')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{t('about.dir3')}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>{t('about.dir4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            {t('about.pillarsTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-green-800 mb-2">{t('about.p1Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('about.p1Desc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-green-800 mb-2">{t('about.p2Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('about.p2Desc')}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-green-800 mb-2">{t('about.p3Title')}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t('about.p3Desc')}</p>
            </div>
          </div>
        </section>

        <section className="bg-green-900 text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('about.ctaTitle')}</h2>
          <p className="text-sm sm:text-base text-green-100 max-w-xl mx-auto mb-6">
            {t('about.ctaDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/customer/products"
              className="px-6 py-3 rounded-xl bg-white text-green-900 font-semibold text-sm hover:bg-green-50 transition"
            >
              {t('about.shopBtn')}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl border border-green-300 text-white font-semibold text-sm hover:bg-green-800 transition"
            >
              {t('about.joinBtn')}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
