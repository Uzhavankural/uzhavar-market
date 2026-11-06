import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Refund & Cancellation Policy | Uzhavar Market',
  description: 'Cancellation, quality assurance, and refund policy for farm-fresh agricultural goods.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            <span>💰</span> Quality & Transparency
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
            Our commitment to 100% genuine farm products, secure transit, and fair treatment for both customers and cultivators.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 w-[92%] max-w-[900px] mx-auto py-12 sm:py-16">
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-gray-200 shadow-xs prose prose-green max-w-none text-gray-700 leading-relaxed space-y-8">
          
          <div className="bg-green-50 border border-green-200 p-5 rounded-xl mb-6">
            <h2 className="text-base font-bold text-green-900 mb-1 flex items-center gap-2">
              100% Quality & Secure Packaging Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-green-800 m-0">
              We follow a transparent and equitable policy designed to protect buyers from courier transit damage, leaking containers, unsealed items, or incorrect deliveries while supporting our hardworking farmers.
            </p>
          </div>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              1. Order Cancellation Policy
            </h2>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>Before Booking / Dispatch:</strong> Customers can freely cancel an order as long as its status is marked as <strong>Pending</strong>.
              </li>
              <li>
                <strong>After Courier Dispatch:</strong> Once the farmer has packed, sealed, and booked the parcel with the courier/parcel service (status <strong>Shipped</strong>), cancellations cannot be accepted as the consignment is in active transit.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              2. Quality Concerns & Defective Items
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We stand firmly behind the quality of products sold on our platform. You are eligible for a replacement or immediate refund under the following circumstances:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>The delivered parcel was damaged, leaking, unsealed, or expired upon arrival from the courier.</li>
              <li>Items received do not match what you ordered (e.g., incorrect variety or missing quantity).</li>
              <li>Significant discrepancy in weight or count from the product listing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              3. Timeframe for Reporting Issues
            </h2>
            <p className="text-sm sm:text-base mb-3">
              To resolve claims swiftly, any courier transit damage, seal tampering, bottle leakage, or missing items must be reported within <strong>24 to 48 hours of parcel delivery</strong>:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
              <p className="font-bold text-gray-900 mb-1">How to Report a Damaged Item:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Take a clear photograph or brief video of the affected item and parcel packaging.</li>
                <li>Send it via email to <strong>uzhavankural.3@gmail.com</strong> with your Order ID and photos.</li>
                <li>Our support team will verify the claim with the dispatching farmer and approve your refund within 2 to 4 hours.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              4. Refund Processing Timelines
            </h2>
            <p className="text-sm sm:text-base mb-3">
              All transactions on Uzhavar Market are processed exclusively via prepaid online payments (Cash on Delivery is not supported). Once an eligible refund is approved:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>Online Payments (UPI / Cards / Net Banking):</strong> The refund will be automatically credited back to your original source payment account within <strong>3 to 5 business days</strong> (depending on your bank's processing cycles).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              5. Non-Refundable Scenarios
            </h2>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>Delivery failed due to incorrect PIN code, unreachable phone number, or incomplete delivery address provided by the customer preventing courier delivery.</li>
              <li>Customer was unavailable to accept the parcel despite multiple courier contact attempts.</li>
              <li>Complaints submitted more than 48 hours after successful delivery confirmation.</li>
              <li>Damage caused by customer mishandling or improper storage after parcel delivery.</li>
            </ul>
          </section>

          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 m-0">Need assistance with an existing order?</p>
              <p className="text-xs text-gray-500 m-0">Our support desk is active every morning from 7 AM.</p>
            </div>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors"
            >
              Contact Support Desk 📞
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
