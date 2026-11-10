"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, tu, ts, locale } = useLanguage();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadOrder();
    }
  }, [params?.id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", params.id)
        .eq("customer_id", user.id)
        .single();

      if (orderError) {
        console.error("Order fetch error:", orderError);
        setOrder(null);
        return;
      }
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", params.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        console.error("Order items fetch error:", itemsError);
        setItems([]);
        return;
      }
      setItems(itemsData || []);
    } catch (error) {
      console.error("Load order details error:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusClasses(status) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getPaymentClasses(status) {
    if (status === "paid") return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold">{t("orders.loadingOrders")}</h2>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm mt-10">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">{t("orders.orderNotFoundTitle")}</h2>
            <p className="text-gray-500 mb-6">{t("orders.orderNotFoundDesc")}</p>
            <button
              onClick={() => router.push("/customer/orders")}
              className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-800 cursor-pointer"
            >
              ← {t("orders.backToMyOrders")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const orderStatus = order.order_status || "pending";
  const paymentStatus = order.payment_status || "pending";
  const statusClasses = getStatusClasses(orderStatus);
  const paymentClasses = getPaymentClasses(paymentStatus);
  const totalAmount = Number(order.total_amount || 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/customer/orders")}
              className="text-green-700 font-semibold hover:underline mb-2 cursor-pointer bg-transparent border-none p-0"
            >
              ← {t("orders.title")}
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {t("orders.orderDetailsTitle")}
            </h1>
            <p className="text-sm text-gray-500 break-all">
              {t("orders.orderId")}: {order.id}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${statusClasses}`}>
              {ts(orderStatus)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {t("orders.orderedOn", { date: formatDate(order.created_at) })}
            </p>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold mb-5 text-gray-900">{t("orders.orderStatus")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatusStep title={t("orders.stepPlaced")} active={true} icon="📝" />
            <StatusStep
              title={t("orders.stepConfirmed")}
              active={["confirmed", "shipped", "delivered"].includes(orderStatus)}
              icon="✓"
            />
            <StatusStep
              title={t("orders.stepShipped")}
              active={["shipped", "delivered"].includes(orderStatus)}
              icon="🚚"
            />
            <StatusStep title={t("orders.stepDelivered")} active={orderStatus === "delivered"} icon="📦" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold mb-5 text-gray-900">{t("orders.orderedProducts")}</h2>
          {items.length === 0 ? (
            <p className="text-gray-500">{t("orders.noOrderItems")}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => {
                const price = Number(item.price || 0);
                const quantity = Number(item.quantity || 0);
                const itemTotal = Number(item.item_total) || price * quantity;
                return (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-3xl shrink-0">
                      🌾
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                      <p className="text-sm text-gray-500">
                        ₹{price.toFixed(2)} × {quantity} {tu(item.unit || "unit")}
                      </p>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹{itemTotal.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700">{t("orders.totalAmount")}</span>
            <strong className="text-2xl text-gray-900">₹{totalAmount.toFixed(2)}</strong>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold mb-5 text-gray-900">{t("checkout.deliveryDetails")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail label={t("orders.customer")} value={order.customer_name} />
            <Detail label={t("common.phone")} value={order.customer_phone} />
            <Detail label={t("orders.deliveryAddressTitle")} value={order.delivery_address} />
            <Detail label={t("common.village")} value={order.village} />
            <Detail label={t("common.district")} value={order.district} />
            <Detail label={t("orders.orderDate")} value={formatDateTime(order.created_at)} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-900">{t("orders.paymentInformation")}</h2>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">{t("orders.paymentStatusLabel")}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${paymentClasses}`}>
                {ts(paymentStatus)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">{t("orders.amountLabel")}</p>
              <strong className="text-xl text-gray-900">₹{totalAmount.toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <div className="flex justify-center flex-wrap gap-3 mt-4">
          <button
            onClick={() => router.push("/customer/products")}
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-800 cursor-pointer"
          >
            🛒 {t("orders.continueShopping")}
          </button>
          <button
            onClick={() => router.push("/customer/orders")}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer"
          >
            ← {t("nav.backToOrders")}
          </button>
        </div>
      </div>
    </main>
  );
}

function StatusStep({ title, active, icon }) {
  return (
    <div className="text-center p-2">
      <div
        className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
          active ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {icon}
      </div>
      <div className={`text-sm ${active ? "font-bold text-green-700" : "font-medium text-gray-500"}`}>
        {title}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-gray-900 break-words">{value || "-"}</div>
    </div>
  );
}
