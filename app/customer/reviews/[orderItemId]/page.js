"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerReviewPage() {
  const params = useParams();
  const router = useRouter();

  const orderItemId = params?.orderItemId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState(null);
  const [orderItem, setOrderItem] = useState(null);
  const [existingReview, setExistingReview] = useState(null);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderItemId) return;
    loadReviewData();
  }, [orderItemId]);

  async function loadReviewData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data: item, error: itemError } = await supabase
        .from("order_items")
        .select(`id, product_id, product_name, quantity, unit, price, item_total, order_id`)
        .eq("id", orderItemId)
        .single();

      if (itemError || !item) {
        throw new Error("Order item not found.");
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`id, customer_id, order_status`)
        .eq("id", item.order_id)
        .eq("customer_id", currentUser.id)
        .eq("order_status", "delivered")
        .single();

      if (orderError || !order) {
        throw new Error("Review is available only for your delivered orders.");
      }

      setOrderItem({ ...item, order });

      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .select(`id, rating, review_text, approval_status, created_at`)
        .eq("customer_id", currentUser.id)
        .eq("order_id", item.order_id)
        .eq("product_id", item.product_id)
        .eq("review_type", "product")
        .maybeSingle();

      if (reviewError) throw reviewError;

      if (review) {
        setExistingReview(review);
        setRating(review.rating || 0);
        setReviewText(review.review_text || "");
      }
    } catch (err) {
      console.error("Review page error:", err);
      setError(err?.message || "Unable to load review page.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!user || !orderItem) {
      setError("Unable to submit review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: insertError } = await supabase
        .from("reviews")
        .insert({
          customer_id: user.id,
          product_id: orderItem.product_id,
          order_id: orderItem.order_id,
          rating: rating,
          review_text: reviewText.trim() === "" ? null : reviewText.trim(),
          review_type: "product",
          approval_status: "pending",
        })
        .select(`id, rating, review_text, approval_status, created_at`)
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already submitted a review for this product.");
        } else {
          setError(insertError.message || "Unable to submit review.");
        }
        return;
      }

      setExistingReview(data);
      setMessage("⭐ Your review has been submitted successfully. It is waiting for admin approval.");
    } catch (err) {
      console.error("Submit review error:", err);
      setError(err?.message || "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderStars() {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (!existingReview) setRating(star);
            }}
            disabled={!!existingReview}
            className={`text-4xl leading-none p-1 border-none bg-transparent outline-none focus:outline-none transition-colors ${
              star <= rating ? "text-yellow-500" : "text-gray-300"
            } ${
              existingReview ? "cursor-default opacity-90" : "cursor-pointer hover:scale-110"
            }`}
            aria-label={`${star} star`}
          >
            {star <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
        <div className="mt-20 bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Review...</h2>
          <p className="text-gray-500">Please wait.</p>
        </div>
      </main>
    );
  }

  if (error && !orderItem) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
        <div className="mt-20 bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full border border-red-100">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">Unable to Open Review</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/customer/orders")}
            className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            ← Back to My Orders
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/customer/orders")}
            className="text-green-700 font-bold mb-4 hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            ← My Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⭐ Write a Review</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Share your experience with the product you received.
          </p>
        </div>

        {orderItem && (
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-3xl shrink-0">
              🌱
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">{orderItem.product_name}</h2>
              <p className="text-sm text-gray-500 mb-1">
                Quantity: {orderItem.quantity} {orderItem.unit || ""}
              </p>
              <p className="text-sm text-gray-500">
                Order ID: {String(orderItem.order_id).slice(0, 8)}...
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap hidden sm:block">
              ✓ Delivered
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 mb-5">
            <div className="w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
              ✓
            </div>
            <div>
              <strong className="block text-green-800 mb-1">Review Submitted</strong>
              <p className="text-sm text-green-700 m-0 leading-relaxed">{message}</p>
            </div>
          </div>
        )}

        {error && orderItem && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-5 text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {existingReview ? (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-900 m-0">Your Review</h2>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap self-start sm:self-auto ${
                  existingReview.approval_status === "approved"
                    ? "bg-green-100 text-green-800"
                    : existingReview.approval_status === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {existingReview.approval_status === "approved"
                  ? "✓ Approved"
                  : existingReview.approval_status === "rejected"
                  ? "Rejected"
                  : "Pending Approval"}
              </span>
            </div>

            <div className="mb-5">{renderStars()}</div>

            {existingReview.review_text && (
              <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed mb-4 border border-gray-100">
                "{existingReview.review_text}"
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {existingReview.approval_status === "approved"
                ? "Your review has been approved and can be displayed on the product page."
                : existingReview.approval_status === "rejected"
                ? "This review was rejected by admin."
                : "Your review is waiting for admin approval."}
            </p>

            <button
              onClick={() => router.push("/customer/orders")}
              className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors w-full sm:w-auto cursor-pointer"
            >
              ← Back to My Orders
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">How was this product?</h2>
            <p className="text-sm text-gray-500 mb-7">
              Your feedback helps other customers understand the product better.
            </p>

            <div className="mb-7">
              <label className="block font-bold text-gray-700 text-sm mb-3">Your Rating</label>
              {renderStars()}
              <p className="text-xs text-gray-500 mt-2">
                {rating === 0
                  ? "Select a rating"
                  : rating === 1
                  ? "Poor"
                  : rating === 2
                  ? "Fair"
                  : rating === 3
                  ? "Good"
                  : rating === 4
                  ? "Very Good"
                  : "Excellent"}
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="reviewText" className="block font-bold text-gray-700 text-sm mb-2">
                Your Review
              </label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us about the product quality, packaging, delivery experience, or anything else..."
                rows={5}
                maxLength={1000}
                className="w-full p-4 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-green-500 focus:border-green-500 resize-y outline-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1.5">
                {reviewText.length}/1000
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-colors border-none ${
                submitting || rating === 0
                  ? "bg-green-700 opacity-60 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800 cursor-pointer"
              }`}
            >
              {submitting ? "Submitting Review..." : "⭐ Submit Review"}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Your review will be visible after admin approval.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}