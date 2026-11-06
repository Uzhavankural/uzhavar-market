'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#142318] text-gray-300 pt-14 pb-10 border-t border-green-950 font-sans">
      <div className="w-[92%] max-w-[1240px] mx-auto">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 border-b border-green-900/40">
          
          {/* BRAND COLUMN (2 Cols wide on LG) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2.5 text-2xl font-bold text-white tracking-tight hover:text-green-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-green-800/80 border border-green-600/50 flex items-center justify-center text-green-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18c-4.418 0-8 3.582-8 8 0 5 8 10 8 10s8-5 8-10c0-4.418-3.582-8-8-8z" />
                </svg>
              </div>
              <span>Uzhavar Market</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mt-1">
              Direct Farm-to-Doorstep Marketplace in Tamil Nadu. Connecting local farmers directly with conscious consumers for authentic native rice, millets, cold-pressed oils, pure honey, and spices dispatched via reliable parcel and courier services.
            </p>
            <div className="flex items-center gap-2.5 mt-3 text-xs text-green-300 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-green-950/80 border border-green-800/60 px-3 py-1.5 rounded-full font-medium">
                <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                100% Farm Sourced
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-950/80 border border-green-800/60 px-3 py-1.5 rounded-full font-medium">
                <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Parcel & Courier Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 bg-green-950/80 border border-green-800/60 px-3 py-1.5 rounded-full font-medium">
                <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Prepaid Online Orders
              </span>
            </div>
          </div>

          {/* COLUMN 1: QUICK LINKS */}
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-green-800/50 pb-2 inline-block">
              Quick Links
            </h2>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0">
              <li>
                <Link href="/" className="hover:text-green-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/customer/products" className="hover:text-green-400 transition-colors">
                  Explore Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-green-400 transition-colors">
                  My Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/farmer" className="hover:text-green-400 transition-colors">
                  Farmer Portal
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-green-400 transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: COMPANY & COMMUNITY */}
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-green-800/50 pb-2 inline-block">
              Company
            </h2>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0">
              <li>
                <Link href="/about" className="hover:text-green-400 transition-colors font-medium text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-green-400 transition-colors font-medium text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-green-400 transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-green-400 transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: LEGAL & SECURITY */}
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-green-800/50 pb-2 inline-block">
              Legal & Trust
            </h2>
            <ul className="space-y-2.5 text-sm list-none p-0 m-0">
              <li>
                <Link href="/privacy-policy" className="hover:text-green-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-green-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-green-400 transition-colors">
                  Quality Assurance
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-green-400 transition-colors">
                  Email Support
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p className="m-0 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Uzhavar Market. All rights reserved. Direct farmer-to-consumer marketplace.
          </p>

          <div className="flex items-center gap-5 flex-wrap justify-center">
            <Link href="/privacy-policy" className="hover:text-green-300 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-green-300 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-green-300 transition-colors">
              Refunds
            </Link>
            <span>•</span>
            <Link href="/community-guidelines" className="hover:text-green-300 transition-colors">
              Guidelines
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-green-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
