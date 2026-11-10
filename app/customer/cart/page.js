"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CustomerCartPage() {
  const router = useRouter();
  const { t, tu } = useLanguage();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const savedCart = localStorage.getItem(`uzhavar_cart_${user.id}`);

        if (savedCart) {
          setCart(JSON.parse(savedCart));
        } else {
          setCart([]);
        }
      } catch (error) {
        console.error("Cart loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(
      `uzhavar_cart_${user.id}`,
      JSON.stringify(cart)
    );
  }, [cart, user]);

  const updateQuantity = (index, newQuantity) => {
    const item = cart[index];
    const isOrganicComplex = item?.name?.toLowerCase().includes("organic complex");
    const minQty = isOrganicComplex ? 50 : 1;
    if (newQuantity < minQty) return;

    if (
      item.stock_quantity !== null &&
      newQuantity > Number(item.stock_quantity)
    ) {
      alert(t("cart.onlyAvailableAlert", { stock: item.stock_quantity, unit: tu(item.unit || "unit") }));
      return;
    }

    const updatedCart = [...cart];

    updatedCart[index] = {
      ...updatedCart[index],
      quantity: newQuantity,
    };

    setCart(updatedCart);
  };

  const removeItem = (index) => {
    const item = cart[index];

    const confirmRemove = confirm(
      t("cart.confirmRemove", { name: item.name })
    );

    if (!confirmRemove) return;

    const updatedCart = cart.filter((_, i) => i !== index);

    setCart(updatedCart);
  };

  const clearCart = () => {
    if (cart.length === 0) return;

    const confirmClear = confirm(t("cart.confirmClear"));

    if (!confirmClear) return;

    setCart([]);
  };

  const getItemPrice = (item) => {
    return (
      Number(item.price || 0) +
      Number(item.commission_amount || 0)
    );
  };

  const getItemTotal = (item) => {
    return (getItemPrice(item) * Number(item.quantity || 1)) + Number(item.delivery_price || 0);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + getItemTotal(item),
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(t("cart.cartEmptyAlert"));
      return;
    }

    router.push("/customer/checkout");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f8f5] font-sans">
        <p className="text-lg text-gray-600 font-medium animate-pulse">{t("cart.loadingCart")}</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f6f8f5] px-4 py-10 sm:p-10 font-sans">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/customer/products")}
            className="mb-8 text-gray-700 font-medium hover:text-green-800 transition-colors"
          >
            &larr; {t("cart.continueShopping")}
          </button>

          <div className="bg-white rounded-2xl p-10 sm:p-16 text-center shadow-sm border border-gray-100">
            <div className="text-7xl sm:text-8xl mb-6">🛒</div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
              {t("cart.emptyTitle")}
            </h1>
            <p className="text-gray-500 mb-8 text-sm sm:text-base">
              {t("cart.emptyDesc")}
            </p>
            <button
              onClick={() => router.push("/customer/products")}
              className="bg-green-800 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-colors shadow-sm"
            >
              {t("cart.browseProducts")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-8 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/customer/products")}
              className="text-gray-600 hover:text-green-800 font-medium text-sm sm:text-base mb-3 transition-colors"
            >
              &larr; {t("cart.continueShopping")}
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 m-0">
              🛒 {t("cart.title")}
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              {totalItems === 1
                ? t("cart.itemsInCartSingular")
                : t("cart.itemsInCartPlural", { count: totalItems })}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors w-full sm:w-auto"
          >
            {t("cart.clearCart")}
          </button>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* CART ITEMS */}
          <div className="flex-1 w-full flex flex-col gap-4">
            {cart.map((item, index) => {
              const price = getItemPrice(item);
              const itemTotal = getItemTotal(item);

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center relative"
                >
                  {/* IMAGE */}
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl sm:text-5xl">🌾</div>
                    )}
                  </div>

                  {/* PRODUCT INFO */}
                  <div className="flex-1 min-w-0 w-full pr-8 sm:pr-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                      {item.name}
                    </h2>
                    {item.farm_name && (
                      <p className="text-xs sm:text-sm text-gray-500 mb-2 truncate">
                        👨‍🌾 {item.farm_name}
                      </p>
                    )}
                    <p className="text-green-800 font-bold mb-1">
                      ₹{price.toFixed(2)} <span className="text-gray-500 text-sm font-normal">/ {item.unit_count || 1} {tu(item.unit || "unit")}</span>
                    </p>
                    {Number(item.delivery_price) > 0 ? (
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        {t("common.deliveryFee", { amount: Number(item.delivery_price).toFixed(2) })}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">
                        {t("common.freeDelivery")}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500">
                      {t("cart.stockLabel", { stock: item.stock_quantity ?? t("cart.stockAvailable") })}
                    </p>
                  </div>

                  {/* BOTTOM ROW (MOBILE) OR RIGHT SECTION (DESKTOP) */}
                  <div className="w-full sm:w-auto flex flex-row items-center justify-between sm:justify-end sm:flex-col gap-4 sm:gap-6 border-t border-gray-100 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    {/* QUANTITY */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                      <button
                        onClick={() =>
                          updateQuantity(index, Number(item.quantity || 1) - 1)
                        }
                        disabled={Number(item.quantity || 1) <= (item.name?.toLowerCase().includes("organic complex") ? 50 : 1)}
                        className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200"
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center font-bold text-gray-800 text-sm sm:text-base">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(index, Number(item.quantity || 1) + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-700 hover:bg-gray-100 shadow-sm border border-gray-200"
                      >
                        +
                      </button>
                    </div>

                    {/* ITEM TOTAL & REMOVE */}
                    <div className="text-right flex flex-col items-end">
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        ₹{itemTotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium mt-1 sm:mt-2 transition-colors absolute top-4 right-4 sm:static"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div className="w-full lg:w-80 xl:w-96 bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              {t("cart.orderSummary")}
            </h2>
            <div className="flex justify-between items-center text-gray-600 mb-3 text-sm sm:text-base">
              <span>{t("cart.items")}</span>
              <span className="font-medium text-gray-900">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 mb-5 text-sm sm:text-base">
              <span>{t("cart.subtotal")}</span>
              <span className="font-medium text-gray-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            
            <hr className="border-t border-gray-100 my-5" />
            
            <div className="flex justify-between items-center text-lg sm:text-xl font-bold mb-6">
              <span className="text-gray-900">{t("cart.total")}</span>
              <span className="text-green-800">₹{cartTotal.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCheckout}
                className="w-full bg-green-800 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-base transition-colors focus:ring-4 focus:ring-green-100 shadow-sm"
              >
                {t("cart.proceedToCheckout")} &rarr;
              </button>
              <button
                onClick={() => router.push("/customer/products")}
                className="w-full bg-white hover:bg-gray-50 text-green-800 border border-green-800 py-3 rounded-xl font-semibold text-sm sm:text-base transition-colors"
              >
                {t("cart.continueShopping")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
