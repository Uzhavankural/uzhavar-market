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
        data: {
          user: currentUser,
        },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // --------------------------------------------------
      // STEP 1: Get order item
      // --------------------------------------------------

      const { data: item, error: itemError } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          product_name,
          quantity,
          unit,
          price,
          item_total,
          order_id
        `)
        .eq("id", orderItemId)
        .single();

      if (itemError || !item) {
        throw new Error("Order item not found.");
      }

      // --------------------------------------------------
      // STEP 2: Verify customer owns the order
      //        and order is delivered
      // --------------------------------------------------

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          customer_id,
          order_status
        `)
        .eq("id", item.order_id)
        .eq("customer_id", currentUser.id)
        .eq("order_status", "delivered")
        .single();

      if (orderError || !order) {
        throw new Error(
          "Review is available only for your delivered orders."
        );
      }

      setOrderItem({
        ...item,
        order,
      });

      // --------------------------------------------------
      // STEP 3: Check whether review already exists
      // --------------------------------------------------

      const {
        data: review,
        error: reviewError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          review_text,
          approval_status,
          created_at
        `)
        .eq("customer_id", currentUser.id)
        .eq("order_id", item.order_id)
        .eq("product_id", item.product_id)
        .eq("review_type", "product")
        .maybeSingle();

      if (reviewError) {
        throw reviewError;
      }

      if (review) {
        setExistingReview(review);
        setRating(review.rating || 0);
        setReviewText(review.review_text || "");
      }
    } catch (err) {
      console.error("Review page error:", err);

      setError(
        err?.message || "Unable to load review page."
      );
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
      // --------------------------------------------------
      // Insert review
      // RLS will verify:
      // Customer + delivered order + matching product
      // --------------------------------------------------

      const { data, error: insertError } = await supabase
        .from("reviews")
        .insert({
          customer_id: user.id,
          product_id: orderItem.product_id,
          order_id: orderItem.order_id,
          rating: rating,
          review_text:
            reviewText.trim() === ""
              ? null
              : reviewText.trim(),
          review_type: "product",
          approval_status: "pending",
        })
        .select(`
          id,
          rating,
          review_text,
          approval_status,
          created_at
        `)
        .single();

      if (insertError) {
        console.error(
          "Review insert error:",
          insertError
        );

        if (
          insertError.code === "23505"
        ) {
          setError(
            "You have already submitted a review for this product."
          );
        } else {
          setError(
            insertError.message ||
              "Unable to submit review."
          );
        }

        return;
      }

      setExistingReview(data);

      setMessage(
        "⭐ Your review has been submitted successfully. It is waiting for admin approval."
      );
    } catch (err) {
      console.error(
        "Submit review error:",
        err
      );

      setError(
        err?.message ||
          "Unable to submit your review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderStars() {
    return (
      <div style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (!existingReview) {
                setRating(star);
              }
            }}
            disabled={!!existingReview}
            style={{
              ...styles.starButton,
              cursor: existingReview
                ? "default"
                : "pointer",
              opacity:
                existingReview && star > rating
                  ? 0.35
                  : 1,
            }}
            aria-label={`${star} star`}
          >
            {star <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
    );
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingBox}>
          <div style={styles.loadingIcon}>⭐</div>
          <h2 style={styles.loadingTitle}>
            Loading Review...
          </h2>
          <p style={styles.loadingText}>
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error && !orderItem) {
    return (
      <main style={styles.page}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>⚠️</div>

          <h2 style={styles.errorTitle}>
            Unable to Open Review
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <button
            onClick={() =>
              router.push("/customer/orders")
            }
            style={styles.primaryButton}
          >
            ← Back to My Orders
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Main page
  // --------------------------------------------------

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* Header */}

        <div style={styles.header}>
          <button
            onClick={() =>
              router.push("/customer/orders")
            }
            style={styles.backButton}
          >
            ← My Orders
          </button>

          <h1 style={styles.pageTitle}>
            ⭐ Write a Review
          </h1>

          <p style={styles.pageSubtitle}>
            Share your experience with the product you received.
          </p>
        </div>

        {/* Product Card */}

        {orderItem && (
          <div style={styles.productCard}>

            <div style={styles.productIcon}>
              🌱
            </div>

            <div style={styles.productInfo}>
              <h2 style={styles.productName}>
                {orderItem.product_name}
              </h2>

              <p style={styles.productMeta}>
                Quantity: {orderItem.quantity}{" "}
                {orderItem.unit || ""}
              </p>

              <p style={styles.productMeta}>
                Order ID:{" "}
                {String(orderItem.order_id).slice(0, 8)}
                ...
              </p>
            </div>

            <div style={styles.deliveredBadge}>
              ✓ Delivered
            </div>

          </div>
        )}

        {/* Success message */}

        {message && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>
              ✓
            </div>

            <div>
              <strong style={styles.successTitle}>
                Review Submitted
              </strong>

              <p style={styles.successText}>
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}

        {error && orderItem && (
          <div style={styles.inlineError}>
            ⚠️ {error}
          </div>
        )}

        {/* Existing review */}

        {existingReview ? (
          <div style={styles.reviewCard}>

            <div style={styles.approvedHeader}>
              <h2 style={styles.sectionTitle}>
                Your Review
              </h2>

              <span
                style={{
                  ...styles.statusBadge,
                  background:
                    existingReview.approval_status ===
                    "approved"
                      ? "#dcfce7"
                      : existingReview.approval_status ===
                        "rejected"
                      ? "#fee2e2"
                      : "#fef3c7",
                  color:
                    existingReview.approval_status ===
                    "approved"
                      ? "#166534"
                      : existingReview.approval_status ===
                        "rejected"
                      ? "#991b1b"
                      : "#92400e",
                }}
              >
                {existingReview.approval_status ===
                "approved"
                  ? "✓ Approved"
                  : existingReview.approval_status ===
                    "rejected"
                  ? "Rejected"
                  : "Pending Approval"}
              </span>
            </div>

            <div style={styles.existingRating}>
              {renderStars()}
            </div>

            {existingReview.review_text && (
              <div style={styles.existingText}>
                "{existingReview.review_text}"
              </div>
            )}

            <p style={styles.pendingText}>
              {existingReview.approval_status ===
              "approved"
                ? "Your review has been approved and can be displayed on the product page."
                : existingReview.approval_status ===
                  "rejected"
                ? "This review was rejected by admin."
                : "Your review is waiting for admin approval."}
            </p>

            <button
              onClick={() =>
                router.push("/customer/orders")
              }
              style={styles.primaryButton}
            >
              ← Back to My Orders
            </button>

          </div>
        ) : (
          /* New review form */

          <form
            onSubmit={handleSubmitReview}
            style={styles.reviewCard}
          >

            <h2 style={styles.sectionTitle}>
              How was this product?
            </h2>

            <p style={styles.sectionText}>
              Your feedback helps other customers understand
              the product better.
            </p>

            {/* Rating */}

            <div style={styles.ratingSection}>

              <label style={styles.label}>
                Your Rating
              </label>

              {renderStars()}

              <p style={styles.ratingHint}>
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

            {/* Review text */}

            <div style={styles.textSection}>

              <label
                htmlFor="reviewText"
                style={styles.label}
              >
                Your Review
              </label>

              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) =>
                  setReviewText(e.target.value)
                }
                placeholder="Tell us about the product quality, packaging, delivery experience, or anything else..."
                rows={6}
                maxLength={1000}
                style={styles.textarea}
              />

              <div style={styles.characterCount}>
                {reviewText.length}/1000
              </div>

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={submitting || rating === 0}
              style={{
                ...styles.submitButton,
                opacity:
                  submitting || rating === 0
                    ? 0.55
                    : 1,
                cursor:
                  submitting || rating === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {submitting
                ? "Submitting Review..."
                : "⭐ Submit Review"}
            </button>

            <p style={styles.note}>
              Your review will be visible after admin approval.
            </p>

          </form>
        )}

      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "32px 16px 60px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
  },

  loadingIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  loadingTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: "24px",
  },

  loadingText: {
    margin: 0,
    color: "#6b7280",
  },

  loadingBox: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "40px 24px",
    textAlign: "center",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.08)",
  },

  errorBox: {
    maxWidth: "550px",
    margin: "100px auto",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "40px 24px",
    textAlign: "center",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.08)",
  },

  errorIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  errorTitle: {
    margin: "0 0 10px",
    color: "#991b1b",
    fontSize: "24px",
  },

  errorText: {
    margin: "0 0 24px",
    color: "#6b7280",
    lineHeight: 1.6,
  },

  header: {
    marginBottom: "24px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#166534",
    fontWeight: "700",
    fontSize: "15px",
    padding: "0",
    cursor: "pointer",
    marginBottom: "18px",
  },

  pageTitle: {
    margin: "0 0 8px",
    fontSize: "32px",
    color: "#111827",
    lineHeight: 1.2,
  },

  pageSubtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  productCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.05)",
  },

  productIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "14px",
    background: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    flexShrink: 0,
  },

  productInfo: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    margin: "0 0 8px",
    fontSize: "19px",
    color: "#111827",
    wordBreak: "break-word",
  },

  productMeta: {
    margin: "3px 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  deliveredBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  reviewCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "23px",
    color: "#111827",
  },

  sectionText: {
    margin: "0 0 28px",
    color: "#6b7280",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  ratingSection: {
    marginBottom: "28px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    fontWeight: "700",
    color: "#374151",
    fontSize: "14px",
  },

  starContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  starButton: {
    border: "none",
    background: "transparent",
    fontSize: "40px",
    lineHeight: 1,
    padding: "2px",
    color: "#f59e0b",
  },

  ratingHint: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  textSection: {
    marginBottom: "24px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "15px",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#111827",
    background: "#ffffff",
  },

  characterCount: {
    textAlign: "right",
    marginTop: "6px",
    color: "#9ca3af",
    fontSize: "12px",
  },

  submitButton: {
    width: "100%",
    border: "none",
    borderRadius: "12px",
    background: "#166534",
    color: "#ffffff",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: "700",
  },

  note: {
    margin: "12px 0 0",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "12px",
  },

  successBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },

  successIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },

  successTitle: {
    display: "block",
    color: "#166534",
    marginBottom: "3px",
  },

  successText: {
    margin: 0,
    color: "#166534",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  inlineError: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "12px",
    padding: "13px 15px",
    marginBottom: "20px",
    fontSize: "14px",
  },

  approvedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  existingRating: {
    marginBottom: "18px",
  },

  existingText: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    color: "#374151",
    lineHeight: 1.7,
    fontSize: "15px",
    marginBottom: "16px",
  },

  pendingText: {
    margin: "0 0 22px",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  primaryButton: {
    border: "none",
    borderRadius: "10px",
    background: "#166534",
    color: "#ffffff",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
};