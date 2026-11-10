"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const orderId = searchParams.get("order_id");

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 text-center max-w-lg w-full shadow-sm">
      <div className="text-6xl sm:text-7xl mb-4">
        ✅
      </div>

      <h1 className="m-0 mb-3 text-2xl sm:text-3xl font-bold">
        {t("orderSuccess.title")}
      </h1>

      <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
        {t("orderSuccess.description")}
      </p>

      {orderId && (
        <div className="bg-gray-50 p-4 rounded-xl my-6 break-all border border-gray-100">
          <strong className="text-gray-800 block mb-1">{t("orderSuccess.orderId")}</strong>
          <div className="text-sm text-gray-500">
            {orderId}
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/customer/products")}
        className="w-full py-3 px-4 border-none rounded-xl bg-green-700 text-white font-bold text-base cursor-pointer mb-3 hover:bg-green-800 transition-colors"
      >
        {t("orderSuccess.continueShopping")}
      </button>

      <button
        onClick={() => router.push("/customer")}
        className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-white font-semibold text-gray-700 text-base cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {t("orderSuccess.goToDashboard")}
      </button>
    </div>
  );
}

export default function OrderSuccessPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 text-center max-w-lg w-full shadow-sm">
          {t("common.loading")}
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
