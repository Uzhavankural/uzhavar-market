import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Terms & Conditions | Uzhavar Market',
  description: 'Terms of service, platform rules, and guidelines for buyers and farmers on Uzhavar Market.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            <span>📜</span> Platform Rules & Agreement
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
            Please read these terms carefully before accessing or placing orders through Uzhavar Market.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 w-[92%] max-w-[900px] mx-auto py-12 sm:py-16">
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-gray-200 shadow-xs prose prose-green max-w-none text-gray-700 leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              1. Agreement to Terms
            </h2>
            <p className="text-sm sm:text-base">
              By registering an account, browsing products, or purchasing fresh farm items through Uzhavar Market (&quot;the Platform&quot;), you agree to be legally bound by these Terms and Conditions. If you disagree with any part of these terms, you should discontinue using the platform immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              2. Marketplace Architecture & Logistics
            </h2>
            <p className="text-sm sm:text-base">
              Uzhavar Market acts as a digital marketplace enabling registered farmers in Tamil Nadu to showcase and sell authentic farm-direct agricultural goods (native rice, millets, cold-pressed oils, pure honey, pulses, and spices) directly to end consumers. We do not operate an internal delivery fleet. Instead, each individual farmer securely packages the items and books them through reputed regional courier or parcel services (such as Professional Courier, ST Courier, India Post, or private parcel transport services) directly to the buyer's destination.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              3. Farmer Obligations & Product Authenticity
            </h2>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>Genuine Origin:</strong> Farmers must only list authentic goods produced or processed directly from their own or verified partnered regional farms with accurate origins.
              </li>
              <li>
                <strong>Accurate Stock & Pricing:</strong> Listed prices per kg/unit and available stock quantities must be maintained truthfully.
              </li>
              <li>
                <strong>Packaging & Courier Dispatch:</strong> All products must be securely sealed, packed in food-grade, leak-proof materials to withstand transit, and booked at a nearby courier/parcel office promptly upon order confirmation.
              </li>
              <li>
                <strong>No Misleading Claims:</strong> Products labeled as natural or organic must adhere strictly to verified non-synthetic cultivation standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              4. Buyer Responsibilities
            </h2>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>Accurate Information:</strong> Buyers must provide valid 10-digit phone numbers and complete delivery addresses with verifiable PIN codes so that courier delivery agents can locate the recipient without delay.
              </li>
              <li>
                <strong>Parcel Reception:</strong> Buyers must ensure someone is available to receive the parcel upon courier arrival at the scheduled address.
              </li>
              <li>
                <strong>Honest Reviews:</strong> Feedback and star ratings must reflect authentic personal consumption experiences without abusive or defamatory remarks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              5. Pricing, Payment & Order Cancellations
            </h2>
            <p className="text-sm sm:text-base mb-3">
              All prices listed on the marketplace are in Indian Rupees (INR) and represent the total final price (including base farmer price and platform commission).
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>100% Prepaid Online Payments:</strong> All orders must be paid online via UPI, debit/credit cards, or net banking prior to order confirmation. Cash on Delivery (COD) is not supported.
              </li>
              <li>
                <strong>Dispatch & Tracking:</strong> Farmers dispatch parcels through nearby courier/parcel booking offices. Once an order is handed over to the courier partner, cancellations cannot be accepted as the consignment is in active transit.
              </li>
              <li>
                <strong>Farmer Settlements:</strong> Farmer payouts are disbursed following confirmed delivery status.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              6. Account Suspension & Anti-Abuse
            </h2>
            <p className="text-sm sm:text-base">
              Uzhavar Market reserves the right to suspend or permanently ban any user account (farmer or buyer) engaged in fraudulent activities, false payment disputes, substandard product supply, or failure to dispatch orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              7. Governing Law & Jurisdiction
            </h2>
            <p className="text-sm sm:text-base">
              These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with this agreement shall be subject to the exclusive jurisdiction of the competent courts in Tamil Nadu, India.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
