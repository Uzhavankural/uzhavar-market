import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'About Us | Uzhavar Market',
  description: 'Empowering Tamil Nadu farmers and consumers through direct farm-to-doorstep trade with zero middlemen.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar activePage="about" />

      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-16 sm:py-24 px-4 sm:px-[6%]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-green-900/80 border border-green-700/60 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-6">
            <span>🌾</span> Our Story & Purpose
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Direct from Soil to Soul. <br />
            <span className="text-green-300">Empowering Every Farmer.</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto">
            Uzhavar Market was founded with a singular conviction: Agriculture is the backbone of Tamil Nadu, and farmers deserve fair remuneration while families deserve authentic, unadulterated, farm-direct traditional food and products.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-[92%] max-w-[1100px] mx-auto py-12 sm:py-20">
        
        {/* THE PROBLEM WE SOLVE */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-xs mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚖️</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 m-0">
              The Challenge We Are Solving
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-6">
            In conventional agricultural supply chains, farm goods pass through 4 to 6 intermediaries before reaching urban homes. Prices are heavily inflated for consumers with commercial adulteration, while the hardworking farmer receives merely 15% to 25% of the end retail price.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div className="bg-red-50 border border-red-200/70 p-5 rounded-xl">
              <h3 className="text-base font-bold text-red-900 mb-2 flex items-center gap-2">
                <span>❌</span> Traditional Supply Chain
              </h3>
              <ul className="text-xs sm:text-sm text-red-800 space-y-2 list-disc list-inside">
                <li>Multiple commission agents and endless warehouse storage</li>
                <li>Commercial mixing, adulteration, and loss of nutritional authenticity</li>
                <li>Farmers receive lowest wholesale margins</li>
                <li>Consumers pay heavy markups with zero origin traceability</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200/70 p-5 rounded-xl">
              <h3 className="text-base font-bold text-green-900 mb-2 flex items-center gap-2">
                <span>✅</span> Uzhavar Market Direct Model
              </h3>
              <ul className="text-xs sm:text-sm text-green-800 space-y-2 list-disc list-inside">
                <li>Direct link between cultivating farmer & buying consumer</li>
                <li>Safely packaged and dispatched via regional parcel & courier services</li>
                <li>Farmers retain up to 85–90% of their product value</li>
                <li>100% transparent pricing with traceable farmer profiles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* THREE CORE PILLARS */}
        <div className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            Our Core Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-start hover:shadow-md transition-shadow">
              <span className="text-4xl mb-4">👨‍🌾</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Farmer First</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Farmers set their own fair rates, track customer orders in real-time, and receive prompt, transparent settlements directly to their bank accounts.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-start hover:shadow-md transition-shadow">
              <span className="text-4xl mb-4">🍯</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pure & Authentic</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Traditional native rice, millets, pulses, cold-pressed wood-pressed oils, pure honey, spices, and organic farm essentials sourced directly from regional cultivators.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-start hover:shadow-md transition-shadow">
              <span className="text-4xl mb-4">🔍</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Full Traceability</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every single product card displays the farmer’s full name, village, and district, fostering genuine community trust and transparency.
              </p>
            </div>

          </div>
        </div>

        {/* IMPACT & CALL TO ACTION */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 text-white rounded-2xl p-8 sm:p-12 text-center shadow-md">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Be Part of the Agricultural Revolution
          </h2>
          <p className="text-sm sm:text-base text-green-100 max-w-xl mx-auto mb-8">
            Whether you are a consumer looking for genuine nutrition or a grower wanting a direct route to urban consumers, Uzhavar Market is built for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/customer/products"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-green-900 font-bold hover:bg-green-50 transition-colors shadow-sm"
            >
              Shop Fresh Products 🛒
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-green-700 text-white font-bold hover:bg-green-600 border border-green-500 transition-colors"
            >
              Join as a Farmer 👨‍🌾
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
