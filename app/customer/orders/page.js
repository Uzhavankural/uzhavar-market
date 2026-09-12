"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewRatings, setReviewRatings] = useState({});
  const [reviewTexts, setReviewTexts] = useState({});
  const [submittedReviews, setSubmittedReviews] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit,
            price,
            item_total
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ORDERS FETCH ERROR:", JSON.stringify(error, null, 2));
        setErrorMessage("Unable to load your orders.");
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error);
      setErrorMessage("Something went wrong while loading your orders.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelivery(order) {
    if (!order?.id) return;

    const currentStatus = String(order.order_status || "").trim().toLowerCase();

    if (currentStatus !== "shipped") {
      setErrorMessage("This order is not ready for delivery confirmation.");
      return;
    }

    if (updatingOrderId === order.id) return;

    const confirmed = window.confirm(
      "Have you received this order?\n\nClick OK only after you have received the products."
    );

    if (!confirmed) return;

    setUpdatingOrderId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update({ order_status: "delivered" })
        .eq("id", order.id)
        .select("id, customer_id, order_status, payment_status")
        .maybeSingle();

      if (error) {
        console.error("DELIVERY CONFIRM ERROR:", JSON.stringify(error, null, 2));
        setErrorMessage(error.message || "Unable to confirm delivery. Please try again.");
        return;
      }

      if (!updatedOrder) {
        setErrorMessage("Delivery could not be confirmed. The order may no longer be in Shipped status. Please refresh the page and try again.");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === order.id ? { ...item, order_status: updatedOrder.order_status } : item
        )
      );

      setMessage("✓ Delivery confirmed successfully. You can now rate your products below.");
    } catch (error) {
      console.error("CONFIRM DELIVERY ERROR:", error);
      setErrorMessage("Something went wrong while confirming delivery.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function getStatusClasses(status) {
    switch (status) {
      case "pending": return "bg-orange-50 text-orange-700 border-orange-100";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-100";
      case "shipped": return "bg-purple-50 text-purple-700 border-purple-100";
      case "delivered": return "bg-green-50 text-green-700 border-green-100";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function getPaymentClasses(status) {
    if (status === "paid") return "bg-green-50 text-green-700";
    return "bg-orange-50 text-orange-700";
  }

  function getStatusText(status) {
    switch (status) {
      case "pending": return "Payment Pending";
      case "confirmed": return "Order Confirmed";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return "Unknown";
    }
  }

  function getStatusDescription(status) {
    switch (status) {
      case "pending": return "Waiting for payment verification and admin confirmation.";
      case "confirmed": return "Your payment is verified. Farmer will prepare and ship your order.";
      case "shipped": return "Your order has been shipped. Confirm after you receive it.";
      case "delivered": return "You confirmed that the order was received.";
      case "cancelled": return "This order has been cancelled.";
      default: return "Order status unavailable.";
    }
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
        <div className="mt-20 bg-white p-10 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🌾</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Orders...</h2>
          <p className="text-gray-500">Please wait.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/customer")}
              className="text-green-700 font-bold mb-2 hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              ← Customer Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 mt-1">Track your orders and delivery status</p>
          </div>
          <button
            onClick={() => router.push("/customer/products")}
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-800 transition-colors border-none cursor-pointer"
          >
            🛒 Continue Shopping
          </button>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 font-semibold shadow-sm">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 font-semibold shadow-sm">
            {errorMessage}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => router.push("/customer/products")}
              className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-800 transition-colors border-none cursor-pointer"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-500 text-sm font-medium">
              <strong className="text-gray-900 font-bold">{orders.length}</strong> {orders.length === 1 ? "Order" : "Orders"}
            </div>

            <div className="flex flex-col gap-6">
              {orders.map((order) => {
                const orderStatus = String(order.order_status || "pending").trim().toLowerCase();
                const paymentStatus = String(order.payment_status || "pending").trim().toLowerCase();
                const statusClasses = getStatusClasses(orderStatus);
                const paymentClasses = getPaymentClasses(paymentStatus);
                const isUpdating = updatingOrderId === order.id;
                const canConfirmDelivery = orderStatus === "shipped";

                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-500 tracking-wider mb-1">ORDER ID</p>
                        <p className="text-sm font-bold text-gray-800 break-all m-0">{order.id}</p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-xs font-bold text-gray-500 tracking-wider mb-1">ORDER DATE</p>
                        <p className="text-sm font-bold text-gray-800 m-0">{formatDate(order.created_at)}</p>
                      </div>
                    </div>

                    {/* Banner */}
                    <div className={`mt-5 p-4 rounded-xl border ${statusClasses}`}>
                      <strong className="block text-base mb-1">{getStatusText(orderStatus)}</strong>
                      <p className="text-sm m-0 leading-relaxed">{getStatusDescription(orderStatus)}</p>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5">
                        <span className="text-xs text-gray-500">Total Amount</span>
                        <strong className="text-xl text-green-700">₹{Number(order.total_amount || 0).toFixed(2)}</strong>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 items-start">
                        <span className="text-xs text-gray-500">Order Status</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusClasses}`}>
                          {getStatusText(orderStatus)}
                        </span>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 items-start">
                        <span className="text-xs text-gray-500">Payment</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentClasses}`}>
                          {paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-5 p-4 sm:p-5 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                      <h3 className="text-base font-bold text-gray-900 mb-4">Order Progress</h3>
                      <div className="flex items-center w-full overflow-x-auto pb-2">
                        {/* 1 */}
                        <div className="flex flex-col items-center min-w-[70px] text-center shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-green-700`}>
                            {orderStatus !== "pending" ? "✓" : "1"}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 mt-2">Placed</span>
                        </div>
                        <div className="h-0.5 bg-gray-300 flex-1 min-w-[30px] mx-2 -mt-6"></div>
                        {/* 2 */}
                        <div className="flex flex-col items-center min-w-[70px] text-center shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${["confirmed", "shipped", "delivered"].includes(orderStatus) ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {["confirmed", "shipped", "delivered"].includes(orderStatus) ? "✓" : "2"}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 mt-2">Confirmed</span>
                        </div>
                        <div className="h-0.5 bg-gray-300 flex-1 min-w-[30px] mx-2 -mt-6"></div>
                        {/* 3 */}
                        <div className="flex flex-col items-center min-w-[70px] text-center shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${["shipped", "delivered"].includes(orderStatus) ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {["shipped", "delivered"].includes(orderStatus) ? "✓" : "3"}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 mt-2">Shipped</span>
                        </div>
                        <div className="h-0.5 bg-gray-300 flex-1 min-w-[30px] mx-2 -mt-6"></div>
                        {/* 4 */}
                        <div className="flex flex-col items-center min-w-[70px] text-center shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${orderStatus === "delivered" ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                            {orderStatus === "delivered" ? "✓" : "4"}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 mt-2">Delivered</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Confirmation */}
                    {canConfirmDelivery && (
                      <div className="mt-5 p-4 sm:p-5 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-yellow-800 text-lg font-bold mb-1 mt-0">📦 Order Received?</h3>
                          <p className="text-yellow-900 text-sm m-0 leading-relaxed max-w-xl">
                            Your order has been shipped. After you receive the products, confirm the delivery below.
                          </p>
                        </div>
                        <button
                          onClick={() => confirmDelivery(order)}
                          disabled={isUpdating}
                          className={`shrink-0 bg-green-700 text-white border-none px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                            isUpdating ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800 cursor-pointer"
                          }`}
                        >
                          {isUpdating ? "Confirming..." : "✓ Confirm Order Received"}
                        </button>
                      </div>
                    )}

                    {/* Delivered Message */}
                    {orderStatus === "delivered" && (
                      <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">✓</div>
                        <div>
                          <strong className="block text-green-800 text-sm font-bold mb-0.5">Delivery Confirmed</strong>
                          <p className="text-green-800 text-xs m-0">You confirmed that this order was received successfully.</p>
                        </div>
                      </div>
                    )}

                    {/* Product Reviews */}
                    {orderStatus === "delivered" && Array.isArray(order.order_items) && order.order_items.length > 0 && (
                      <div className="mt-5 p-5 bg-white border border-gray-200 rounded-xl">
                        <h3 className="text-lg font-bold text-gray-900 m-0 mb-1">⭐ Rate Your Products</h3>
                        <p className="text-sm text-gray-500 mb-4 mt-1">How was your experience with the products you received?</p>

                        <div className="flex flex-col gap-3">
                          {order.order_items.map((item) => {
                            const selectedRating = reviewRatings[item.id] || 0;
                            const reviewText = reviewTexts[item.id] || "";
                            const isSubmitted = submittedReviews[item.id];
                            const isSubmitting = reviewSubmitting === item.id;

                            return (
                              <div key={item.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <div className="flex flex-col gap-1 mb-2">
                                  <strong className="text-gray-900 text-sm">{item.product_name}</strong>
                                  <span className="text-gray-500 text-xs">Qty: {item.quantity} {item.unit || ""}</span>
                                </div>

                                {!isSubmitted ? (
                                  <>
                                    <div className="flex items-center gap-1 mb-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setReviewRatings((c) => ({ ...c, [item.id]: star }))}
                                          className={`bg-transparent border-none p-0.5 text-3xl leading-none cursor-pointer focus:outline-none ${
                                            star <= selectedRating ? "text-yellow-500" : "text-gray-300"
                                          }`}
                                        >
                                          {star <= selectedRating ? "★" : "☆"}
                                        </button>
                                      ))}
                                    </div>

                                    {selectedRating > 0 && (
                                      <div className="mt-2">
                                        <textarea
                                          value={reviewText}
                                          onChange={(e) => setReviewTexts((c) => ({ ...c, [item.id]: e.target.value }))}
                                          placeholder="Share your experience with this product..."
                                          rows={3}
                                          maxLength={1000}
                                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500 outline-none"
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                          <span className="text-xs text-gray-400">{reviewText.length}/1000</span>
                                          <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={async () => {
                                              if (selectedRating < 1 || selectedRating > 5) return;
                                              setReviewSubmitting(item.id);
                                              try {
                                                const { data: { user }, error: userError } = await supabase.auth.getUser();
                                                if (userError || !user) {
                                                  router.push("/login");
                                                  return;
                                                }
                                                const { error: reviewError } = await supabase
                                                  .from("reviews")
                                                  .insert({
                                                    customer_id: user.id,
                                                    product_id: item.product_id,
                                                    order_id: order.id,
                                                    rating: selectedRating,
                                                    review_text: reviewText.trim() || null,
                                                    review_type: "product",
                                                    approval_status: "pending",
                                                  });
                                                if (reviewError) {
                                                  if (reviewError.code === "23505") {
                                                    setErrorMessage("You have already submitted a review for this product.");
                                                  } else {
                                                    setErrorMessage(reviewError.message || "Unable to submit review.");
                                                  }
                                                  return;
                                                }
                                                setSubmittedReviews((c) => ({ ...c, [item.id]: true }));
                                                setMessage(`⭐ Review submitted for ${item.product_name}. Waiting for admin approval.`);
                                              } catch (err) {
                                                setErrorMessage("Something went wrong while submitting your review.");
                                              } finally {
                                                setReviewSubmitting(null);
                                              }
                                            }}
                                            className={`border-none bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-green-800 cursor-pointer"
                                            }`}
                                          >
                                            {isSubmitting ? "Submitting..." : "Submit Review"}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-1 text-sm text-green-800">
                                    <strong className="font-bold text-sm">✓ Review Submitted</strong>
                                    <span className="text-xs">Waiting for admin approval.</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <strong className="block text-gray-900 text-sm mb-2">📍 Delivery Address</strong>
                      <p className="text-gray-700 text-sm m-0 leading-relaxed mb-1">{order.delivery_address || "-"}</p>
                      {(order.village || order.district) && (
                        <p className="text-gray-500 text-xs m-0">
                          {order.village || ""}
                          {order.village && order.district ? ", " : ""}
                          {order.district || ""}
                        </p>
                      )}
                    </div>

                    {/* Customer Details */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="block text-gray-500 text-xs mb-1">Customer</span>
                        <strong className="font-bold text-gray-900">{order.customer_name || "-"}</strong>
                      </div>
                      <div>
                        <span className="block text-gray-500 text-xs mb-1">Phone</span>
                        <strong className="font-bold text-gray-900">{order.customer_phone || "-"}</strong>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <span className="block text-gray-500 text-xs mb-1">Created</span>
                        <strong className="text-sm font-bold text-gray-900">{formatDateTime(order.created_at)}</strong>
                      </div>
                      <button
                        onClick={() => router.push(`/customer/orders/${order.id}`)}
                        className="bg-white border border-green-700 text-green-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors w-full sm:w-auto cursor-pointer text-center"
                      >
                        View Order →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}