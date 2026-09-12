"use client";

import { useRouter } from "next/navigation";

export default function CustomerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-4 sm:p-10 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-gray-900">
          Customer Dashboard 🌾
        </h1>

        <p className="text-gray-600 mb-8">
          Welcome to Uzhavar Market
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start gap-2 cursor-pointer text-left text-base shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-4xl">🏠</span>
            <strong className="text-lg text-gray-900">Home</strong>
            <span className="text-gray-600 text-sm">
              Go to Uzhavar Market home page
            </span>
          </button>

          {/* Browse Products */}
          <button
            onClick={() => router.push("/customer/products")}
            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start gap-2 cursor-pointer text-left text-base shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-4xl">🌾</span>
            <strong className="text-lg text-gray-900">Browse Products</strong>
            <span className="text-gray-600 text-sm">
              View fresh products from farmers
            </span>
          </button>

          {/* My Cart */}
          <button
            onClick={() => router.push("/customer/cart")}
            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start gap-2 cursor-pointer text-left text-base shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-4xl">🛒</span>
            <strong className="text-lg text-gray-900">My Cart</strong>
            <span className="text-gray-600 text-sm">
              View products added to your cart
            </span>
          </button>

          {/* My Orders */}
          <button
            onClick={() => router.push("/customer/orders")}
            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start gap-2 cursor-pointer text-left text-base shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-4xl">📦</span>
            <strong className="text-lg text-gray-900">My Orders</strong>
            <span className="text-gray-600 text-sm">
              Track your orders and delivery
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}