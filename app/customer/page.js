"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CustomerPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen p-3 sm:p-8 md:p-10 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="mb-1 sm:mb-2 text-xl sm:text-3xl font-bold text-gray-900">
          {t("customerDashboard.title")} 🌾
        </h1>

        <p className="text-gray-600 text-xs sm:text-base mb-5 sm:mb-8">
          {t("customerDashboard.welcome")}
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🏠</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">{t("nav.home")}</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              {t("customerDashboard.homeDesc")}
            </span>
          </button>

          {/* Browse Products */}
          <button
            onClick={() => router.push("/customer/products")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🌾</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">{t("customerDashboard.browseTitle")}</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              {t("customerDashboard.browseDesc")}
            </span>
          </button>

          {/* My Cart */}
          <button
            onClick={() => router.push("/customer/cart")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">🛒</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">{t("nav.myCart")}</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              {t("customerDashboard.cartDesc")}
            </span>
          </button>

          {/* My Orders */}
          <button
            onClick={() => router.push("/customer/orders")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">📦</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">{t("nav.myOrders")}</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              {t("customerDashboard.ordersDesc")}
            </span>
          </button>

          {/* My Profile */}
          <button
            onClick={() => router.push("/customer/profile")}
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 md:p-6 flex flex-col items-start gap-1 sm:gap-2 cursor-pointer text-left shadow-xs hover:shadow-md hover:border-green-600 transition-all active:scale-95"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl mb-0.5 sm:mb-1">👤</span>
            <strong className="text-xs sm:text-base md:text-lg text-gray-900 font-bold leading-tight">{t("customerDashboard.profileTitle")}</strong>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-snug line-clamp-2">
              {t("customerDashboard.profileDesc")}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
