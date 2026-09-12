"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("order_id");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 text-center max-w-lg w-full shadow-sm">
        <div className="text-6xl sm:text-7xl mb-4">
          ✅
        </div>

        <h1 className="m-0 mb-3 text-2xl sm:text-3xl font-bold">
          Order Placed Successfully!
        </h1>

        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
          Your order has been successfully placed.
          Payment verification and order confirmation are pending.
          You can track your order status from My Orders.
        </p>

        {orderId && (
          <div className="bg-gray-50 p-4 rounded-xl my-6 break-all border border-gray-100">
            <strong className="text-gray-800 block mb-1">Order ID</strong>
            <div className="text-sm text-gray-500">
              {orderId}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/customer/products")}
          className="w-full py-3 px-4 border-none rounded-xl bg-green-700 text-white font-bold text-base cursor-pointer mb-3 hover:bg-green-800 transition-colors"
        >
          Continue Shopping
        </button>

        <button
          onClick={() => router.push("/customer")}
          className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-white font-semibold text-gray-700 text-base cursor-pointer hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </main>
  );
}