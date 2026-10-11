"use client";

import { useRouter } from "next/navigation";

export default function CustomerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-3 sm:p-8 md:p-10 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="mb-1 sm:mb-2 text-xl sm:text-3xl font-bold text-gray-900">
          Customer Dashboard 🌾
        </h1>

        <p className="text-gray-600 text-xs sm:text-base mb-5 sm:mb-8">
          Welcome to Uzhavar Market
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🏠</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">Home</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              Go to Uzhavar Market home page
            </span>
          </button>

          {/* Browse Products */}
          <button
            onClick={() => router.push("/customer/products")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🌾</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">Browse Products</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              View fresh products from farmers
            </span>
          </button>

          {/* My Cart */}
          <button
            onClick={() => router.push("/customer/cart")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🛒</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">My Cart</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              View products added to your cart
            </span>
          </button>

          {/* My Orders */}
          <button
            onClick={() => router.push("/customer/orders")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">📦</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">My Orders</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              Track your orders and delivery
            </span>
          </button>

          {/* My Profile */}
          <button
            onClick={() => router.push("/customer/profile")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">👤</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">My Profile</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              Manage your delivery addresses
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}