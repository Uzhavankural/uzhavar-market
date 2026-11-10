'use client'

import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useLanguage } from '@/app/context/LanguageContext'

export default function RefundContent() {
  const { t } = useLanguage()
  const s2Items = t('refund.s2Items')
  const s5Items = t('refund.s5Items')

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5] text-gray-800">
      <Navbar />

      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-12 sm:py-16 px-4 sm:px-[6%] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            {t('refund.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {t('refund.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto leading-relaxed">
            {t('refund.subtitle')}
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h2 className="text-base sm:text-lg font-bold text-green-900 mb-1.5">
              {t('refund.guaranteeTitle')}
            </h2>
            <p className="text-sm text-green-800">{t('refund.guaranteeDesc')}</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('refund.s1Title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-gray-900">{t('refund.s1BeforeBold')}</strong>{' '}
                {t('refund.s1BeforeText')}
              </li>
              <li>
                <strong className="text-gray-900">{t('refund.s1AfterBold')}</strong>{' '}
                {t('refund.s1AfterText')}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('refund.s2Title')}</h2>
            <p className="mb-3">{t('refund.s2Intro')}</p>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s2Items) && s2Items.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('refund.s3Title')}</h2>
            <p className="mb-4">
              {t('refund.s3Intro1')}
              <strong className="text-gray-900">{t('refund.s3IntroBold')}</strong>
              {t('refund.s3Intro2')}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
              <p className="font-bold text-amber-900 text-sm">{t('refund.s3HowTitle')}</p>
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-amber-900">
                <li>{t('refund.s3Step1')}</li>
                <li>{t('refund.s3Step2')}</li>
                <li>{t('refund.s3Step3')}</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('refund.s4Title')}</h2>
            <p className="mb-3">{t('refund.s4Intro')}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
              <strong className="text-gray-900">{t('refund.s4Bold')}</strong>{' '}
              <span>{t('refund.s4Text')}</span>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{t('refund.s5Title')}</h2>
            <ul className="list-disc pl-5 space-y-2">
              {Array.isArray(s5Items) && s5Items.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <div className="bg-green-900 text-white rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-lg">{t('refund.ctaTitle')}</h3>
              <p className="text-xs sm:text-sm text-green-200 mt-0.5">{t('refund.ctaSub')}</p>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-white text-green-900 font-semibold text-sm hover:bg-green-50 transition whitespace-nowrap"
            >
              {t('refund.ctaBtn')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
