import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Privacy Policy | Uzhavar Market',
  description: 'How Uzhavar Market collects, uses, and safeguards customer and farmer data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col font-sans">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#15341c] to-[#1c4826] text-white py-14 sm:py-20 px-4 sm:px-[6%]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-green-900/80 border border-green-700/60 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-green-300 mb-4">
            <span>🔒</span> Legal & Privacy
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
            Last updated: November 2026. Your privacy and trust are fundamental to our mission at Uzhavar Market.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 w-[92%] max-w-[900px] mx-auto py-12 sm:py-16">
        <div className="bg-white p-6 sm:p-12 rounded-2xl border border-gray-200 shadow-xs prose prose-green max-w-none text-gray-700 leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              1. Introduction
            </h2>
            <p className="text-sm sm:text-base">
              Uzhavar Market (referred to as &quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) is a digital marketplace connecting farmers directly with consumers across Tamil Nadu, India. This Privacy Policy outlines our transparent practices regarding the collection, processing, storage, and protection of personal data belonging to our customers, farmers, and website visitors in accordance with applicable Indian laws, including the Information Technology Act, 2000 and Digital Personal Data Protection Act (DPDP Act).
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              2. Information We Collect
            </h2>
            <p className="text-sm sm:text-base mb-3">
              We collect only the minimum necessary information required to facilitate direct agricultural trade and order deliveries:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>Customer Profile Information:</strong> Name, email address, mobile phone number, delivery street address, village/city, district, and PIN code.
              </li>
              <li>
                <strong>Farmer Information:</strong> Name, contact number, farm location, village, district, crop listings, product inventory, and bank account/UPI details exclusively for receiving direct order settlements.
              </li>
              <li>
                <strong>Order & Transaction Records:</strong> Purchased items, order quantities, delivery timestamps, online payment reference IDs, payment confirmation status, and review ratings.
              </li>
              <li>
                <strong>Technical Information:</strong> IP address, device type, browser information, and session logs collected automatically to maintain website stability and prevent security abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              3. How We Use Your Information
            </h2>
            <p className="text-sm sm:text-base mb-3">
              Your data is utilized strictly for marketplace operations:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>Facilitating the preparation, packaging, and parcel courier dispatch of authentic farm goods.</li>
              <li>Enabling farmers to receive instant order notifications and accurately dispatch packages via nearby parcel offices.</li>
              <li>Disbursing farmer payment settlements with 100% mathematical auditability and transparency.</li>
              <li>Sending essential account notifications, such as order confirmation, courier tracking, and verification emails.</li>
              <li>Detecting and mitigating fraud, preventing account misuse, and ensuring platform integrity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              4. Zero Data Selling & Sharing Principles
            </h2>
            <p className="text-sm sm:text-base mb-3">
              <strong>We do not sell, rent, or trade your personal data to advertisers or third-party brokers.</strong> Data is shared only under strict operational boundaries:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>
                <strong>With Fulfilling Farmers:</strong> When a customer places an order, the relevant farmer receives only the customer’s delivery address and contact number strictly to pack and book that specific parcel.
              </li>
              <li>
                <strong>With Courier & Parcel Services:</strong> Recipient delivery name, phone number, address, and PIN code are shared with logistics parcel/courier carriers (e.g., ST Courier, Professional Courier, India Post) solely for physical parcel transit and delivery.
              </li>
              <li>
                <strong>With Payment Processors:</strong> Financial transactions are processed securely through RBI-licensed payment gateways with PCI-DSS compliance. We never store sensitive debit/credit card numbers or CVVs on our servers.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If compelled by lawful order or court mandate under Indian jurisprudence.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              5. Data Security & Storage
            </h2>
            <p className="text-sm sm:text-base">
              All user records, passwords, and order histories are stored in enterprise-grade encrypted databases with Row Level Security (RLS) enforcement. Passwords are cryptographically hashed using salted algorithms so that no platform administrator can view your plaintext password.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              6. Your Rights & Control Over Data
            </h2>
            <p className="text-sm sm:text-base mb-3">
              You maintain complete ownership of your personal profile:
            </p>
            <ul className="text-sm sm:text-base space-y-2 list-disc list-inside">
              <li>You can view and modify your delivery addresses at any time via your Customer Profile dashboard.</li>
              <li>You can request a complete export or deletion of your account and associated records by emailing our Grievance Desk.</li>
              <li>You can choose whether to leave public reviews on completed farm orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
              7. Grievance Officer & Contact Details
            </h2>
            <p className="text-sm sm:text-base mb-2">
              For any questions, concerns, or privacy grievances regarding your personal data, please contact our designated Grievance Officer:
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
              <p className="m-0 font-bold text-gray-900">Grievance & Privacy Desk</p>
              <p className="m-0 text-gray-600">Uzhavar Market Online Operations (Tamil Nadu, India)</p>
              <p className="m-0 text-green-800 font-semibold mt-1">Email: uzhavankural.3@gmail.com</p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
