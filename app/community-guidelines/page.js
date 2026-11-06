import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Community Guidelines | Uzhavar Market',
  description: 'Ethical standards, fair pricing, and mutual respect guidelines for farmers and consumers.',
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar activePage="guidelines" />

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            <span>🤝</span> Trust & Shared Values
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Community Guidelines
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
            Uzhavar Market thrives on mutual dignity, authentic agriculture, and genuine respect between cultivating farmers and conscious buyers.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 w-[92%] max-w-[900px] mx-auto py-12 sm:py-16">
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-gray-200 shadow-xs prose prose-green max-w-none text-gray-700 leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              1. Our Community Foundation
            </h2>
            <p className="text-sm sm:text-base">
              Uzhavar Market is not merely a transactional website — it is a grassroots agricultural movement. We connect rural farm families across Tamil Nadu directly with consumers who value wholesome food. To preserve the warmth, honesty, and safety of our ecosystem, every member agrees to adhere to these community standards.
            </p>
          </section>

          {/* FOR FARMERS */}
          <section className="bg-green-50/70 border border-green-200/80 p-6 rounded-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-green-950 mb-3">
              Guidelines for Farmers & Producers
            </h2>
            <ul className="text-sm sm:text-base space-y-2.5 list-disc list-inside text-green-900">
              <li>
                <strong>Authentic Farm Products:</strong> Only list authentic agricultural goods and naturally processed foods produced on your own land or verified regional community farms. Do not resell expired commercial stock.
              </li>
              <li>
                <strong>Honest Representation:</strong> Disclose product grades and varieties accurately. If products have natural variations or traditional characteristics, describe them transparently.
              </li>
              <li>
                <strong>Fair & Equitable Pricing:</strong> Set realistic rates that reflect genuine cultivation costs and farmer dignity, without predatory spikes.
              </li>
              <li>
                <strong>Careful Packaging & Courier Booking:</strong> Clean, securely seal, and pack all items in food-grade, leak-proof materials to withstand transit when dispatched via nearby courier/parcel services.
              </li>
            </ul>
          </section>

          {/* FOR CONSUMERS */}
          <section className="bg-blue-50/70 border border-blue-200/80 p-6 rounded-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-blue-950 mb-3">
              Guidelines for Consumers & Buyers
            </h2>
            <ul className="text-sm sm:text-base space-y-2.5 list-disc list-inside text-blue-900">
              <li>
                <strong>Appreciate Natural Authenticity:</strong> Natural farm goods (traditional rice varieties, wood-pressed oils, wild honey) do not look like uniform factory plastics. Natural variations in color and aroma are indicators of authentic processing.
              </li>
              <li>
                <strong>Timely Parcel Reception:</strong> Orders are dispatched via parcel/courier services to your door. Please ensure an active phone number and correct PIN code so the courier delivery agent can reach you without delay.
              </li>
              <li>
                <strong>Constructive & Honest Reviews:</strong> Reviews help farmers improve and help other families choose. Share constructive, respectful feedback.
              </li>
              <li>
                <strong>Responsible Cancellation:</strong> Avoid cancelling orders once the farmer has securely packed and handed over the parcel to the courier/parcel service.
              </li>
            </ul>
          </section>

          {/* ZERO TOLERANCE */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              Zero Tolerance Violations
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We uphold strict safety and ethical standards. Immediate suspension will apply to:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>Harassment, abusive language, or discrimination toward courier delivery agents, farmers, or customers.</li>
              <li>Fabricating fake reviews, defamatory star ratings, or competitor sabotage.</li>
              <li>Repeated fraudulent claims of missing items on delivered orders.</li>
              <li>Listing adulterated oils, contaminated food products, banned chemical pesticides, or misrepresenting organic purity.</li>
            </ul>
          </section>

          <section className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 m-0">Witnessed a violation or have a suggestion?</p>
              <p className="text-xs text-gray-500 m-0">Help us keep our agricultural community clean and trusted.</p>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors"
            >
              Report an Issue
            </Link>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
