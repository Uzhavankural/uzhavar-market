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

  useEffect(() => {
    loadOrders();
  }, []);

  // ==================================================
  // LOAD ORDERS
  // ==================================================

  async function loadOrders() {
    try {
      setLoading(true);
      setMessage("");
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "ORDERS FETCH ERROR:",
          JSON.stringify(error, null, 2)
        );

        setErrorMessage(
          "Unable to load your orders."
        );

        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error(
        "LOAD ORDERS ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // CUSTOMER CONFIRM DELIVERY
  // ==================================================

  async function confirmDelivery(order) {
    if (!order?.id) return;

    const currentStatus = String(
      order.order_status || ""
    )
      .trim()
      .toLowerCase();

    // Customer can confirm ONLY shipped orders
    if (currentStatus !== "shipped") {
      setErrorMessage(
        "This order is not ready for delivery confirmation."
      );
      return;
    }

    // Prevent duplicate clicks
    if (updatingOrderId === order.id) {
      return;
    }

    const confirmed = window.confirm(
      "Have you received this order?\n\nClick OK only after you have received the products."
    );

    if (!confirmed) {
      return;
    }

    setUpdatingOrderId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ------------------------------------------------
      // IMPORTANT
      //
      // RLS policy already checks:
      //
      // customer_id = auth.uid()
      // AND current order_status = shipped
      //
      // So we only need to match the order ID here.
      // ------------------------------------------------

      const {
        data: updatedOrder,
        error,
      } = await supabase
        .from("orders")
        .update({
          order_status: "delivered",
        })
        .eq("id", order.id)
        .select(
          "id, customer_id, order_status, payment_status"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "DELIVERY CONFIRM ERROR:",
          JSON.stringify(error, null, 2)
        );

        setErrorMessage(
          error.message ||
            "Unable to confirm delivery. Please try again."
        );

        return;
      }

      // ------------------------------------------------
      // If no row was returned, update did not happen.
      // ------------------------------------------------

      if (!updatedOrder) {
        console.error(
          "DELIVERY CONFIRM ERROR: No order was updated.",
          {
            orderId: order.id,
            currentStatus,
            userId: user.id,
          }
        );

        setErrorMessage(
          "Delivery could not be confirmed. The order may no longer be in Shipped status. Please refresh the page and try again."
        );

        return;
      }

      // ------------------------------------------------
      // UPDATE LOCAL STATE
      // ------------------------------------------------

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === order.id
            ? {
                ...item,
                order_status:
                  updatedOrder.order_status,
              }
            : item
        )
      );

      setMessage(
        "✓ Delivery confirmed successfully."
      );
    } catch (error) {
      console.error(
        "CONFIRM DELIVERY ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while confirming delivery."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ==================================================
  // STATUS STYLE
  // ==================================================

  function getStatusStyle(status) {
    const currentStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    switch (currentStatus) {
      case "pending":
        return {
          background: "#fff7ed",
          color: "#c2410c",
        };

      case "confirmed":
        return {
          background: "#eff6ff",
          color: "#1d4ed8",
        };

      case "shipped":
        return {
          background: "#f5f3ff",
          color: "#6d28d9",
        };

      case "delivered":
        return {
          background: "#ecfdf5",
          color: "#047857",
        };

      case "cancelled":
        return {
          background: "#fef2f2",
          color: "#b91c1c",
        };

      default:
        return {
          background: "#f3f4f6",
          color: "#374151",
        };
    }
  }

  // ==================================================
  // PAYMENT STYLE
  // ==================================================

  function getPaymentStyle(status) {
    const currentStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    if (currentStatus === "paid") {
      return {
        background: "#ecfdf5",
        color: "#047857",
      };
    }

    return {
      background: "#fff7ed",
      color: "#c2410c",
    };
  }

  // ==================================================
  // STATUS TEXT
  // ==================================================

  function getStatusText(status) {
    const currentStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    switch (currentStatus) {
      case "pending":
        return "Payment Pending";

      case "confirmed":
        return "Order Confirmed";

      case "shipped":
        return "Shipped";

      case "delivered":
        return "Delivered";

      case "cancelled":
        return "Cancelled";

      default:
        return "Unknown";
    }
  }

  // ==================================================
  // STATUS DESCRIPTION
  // ==================================================

  function getStatusDescription(status) {
    const currentStatus = String(
      status || ""
    )
      .trim()
      .toLowerCase();

    switch (currentStatus) {
      case "pending":
        return "Waiting for payment verification and admin confirmation.";

      case "confirmed":
        return "Your payment is verified. Farmer will prepare and ship your order.";

      case "shipped":
        return "Your order has been shipped. Confirm after you receive it.";

      case "delivered":
        return "You confirmed that the order was received.";

      case "cancelled":
        return "This order has been cancelled.";

      default:
        return "Order status unavailable.";
    }
  }

  // ==================================================
  // FORMAT DATE
  // ==================================================

  function formatDate(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ==================================================
  // FORMAT DATE + TIME
  // ==================================================

  function formatDateTime(date) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingIcon}>
            🌾
          </div>

          <h2 style={styles.loadingTitle}>
            Loading Orders...
          </h2>

          <p style={styles.loadingText}>
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* ==========================================
            HEADER
        ========================================== */}

        <div style={styles.header}>
          <div>
            <button
              onClick={() =>
                router.push("/customer")
              }
              style={styles.backButton}
            >
              ← Customer Dashboard
            </button>

            <h1 style={styles.title}>
              My Orders
            </h1>

            <p style={styles.subtitle}>
              Track your orders and delivery status
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/customer/products")
            }
            style={styles.shopButton}
          >
            🛒 Continue Shopping
          </button>
        </div>

        {/* ==========================================
            SUCCESS MESSAGE
        ========================================== */}

        {message && (
          <div style={styles.successMessage}>
            {message}
          </div>
        )}

        {/* ==========================================
            ERROR MESSAGE
        ========================================== */}

        {errorMessage && (
          <div style={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {/* ==========================================
            EMPTY ORDERS
        ========================================== */}

        {orders.length === 0 ? (
          <div style={styles.emptyCard}>

            <div style={styles.emptyIcon}>
              📦
            </div>

            <h2 style={styles.emptyTitle}>
              No Orders Yet
            </h2>

            <p style={styles.emptyText}>
              You haven't placed any orders yet.
            </p>

            <button
              onClick={() =>
                router.push("/customer/products")
              }
              style={styles.primaryButton}
            >
              Browse Products
            </button>

          </div>
        ) : (
          <>
            {/* ======================================
                ORDER COUNT
            ====================================== */}

            <div style={styles.orderCount}>
              <strong>
                {orders.length}
              </strong>{" "}
              {orders.length === 1
                ? "Order"
                : "Orders"}
            </div>

            {/* ======================================
                ORDERS LIST
            ====================================== */}

            <div style={styles.ordersList}>

              {orders.map((order) => {
                const orderStatus =
                  String(
                    order.order_status ||
                      "pending"
                  )
                    .trim()
                    .toLowerCase();

                const paymentStatus =
                  String(
                    order.payment_status ||
                      "pending"
                  )
                    .trim()
                    .toLowerCase();

                const statusStyle =
                  getStatusStyle(
                    orderStatus
                  );

                const paymentStyle =
                  getPaymentStyle(
                    paymentStatus
                  );

                const isUpdating =
                  updatingOrderId ===
                  order.id;

                const canConfirmDelivery =
                  orderStatus === "shipped";

                return (
                  <div
                    key={order.id}
                    style={styles.orderCard}
                  >

                    {/* ==================================
                        ORDER HEADER
                    ================================== */}

                    <div style={styles.orderHeader}>

                      <div style={styles.orderHeaderLeft}>

                        <p style={styles.smallLabel}>
                          ORDER ID
                        </p>

                        <p style={styles.orderId}>
                          {order.id}
                        </p>

                      </div>

                      <div style={styles.orderDateBox}>

                        <p style={styles.smallLabel}>
                          ORDER DATE
                        </p>

                        <p style={styles.orderDate}>
                          {formatDate(
                            order.created_at
                          )}
                        </p>

                      </div>

                    </div>

                    {/* ==================================
                        STATUS BANNER
                    ================================== */}

                    <div
                      style={{
                        ...styles.statusBanner,
                        background:
                          statusStyle.background,
                        color:
                          statusStyle.color,
                      }}
                    >

                      <div>
                        <strong
                          style={
                            styles.statusBannerTitle
                          }
                        >
                          {getStatusText(
                            orderStatus
                          )}
                        </strong>

                        <p
                          style={
                            styles.statusBannerText
                          }
                        >
                          {getStatusDescription(
                            orderStatus
                          )}
                        </p>
                      </div>

                    </div>

                    {/* ==================================
                        ORDER INFO
                    ================================== */}

                    <div style={styles.infoGrid}>

                      {/* TOTAL */}

                      <div style={styles.infoBox}>

                        <span
                          style={styles.label}
                        >
                          Total Amount
                        </span>

                        <strong
                          style={
                            styles.totalAmount
                          }
                        >
                          ₹
                          {Number(
                            order.total_amount ||
                              0
                          ).toFixed(2)}
                        </strong>

                      </div>

                      {/* ORDER STATUS */}

                      <div style={styles.infoBox}>

                        <span
                          style={styles.label}
                        >
                          Order Status
                        </span>

                        <span
                          style={{
                            ...styles.badge,
                            ...statusStyle,
                          }}
                        >
                          {getStatusText(
                            orderStatus
                          )}
                        </span>

                      </div>

                      {/* PAYMENT */}

                      <div style={styles.infoBox}>

                        <span
                          style={styles.label}
                        >
                          Payment
                        </span>

                        <span
                          style={{
                            ...styles.badge,
                            ...paymentStyle,
                          }}
                        >
                          {paymentStatus ===
                          "paid"
                            ? "Paid"
                            : "Payment Pending"}
                        </span>

                      </div>

                    </div>

                    {/* ==================================
                        ORDER PROGRESS
                    ================================== */}

                    <div
                      style={
                        styles.progressSection
                      }
                    >

                      <h3
                        style={
                          styles.progressTitle
                        }
                      >
                        Order Progress
                      </h3>

                      <div
                        style={
                          styles.progressSteps
                        }
                      >

                        {/* STEP 1 */}

                        <div
                          style={
                            styles.progressStep
                          }
                        >
                          <div
                            style={{
                              ...styles.stepCircle,
                              ...(orderStatus !==
                              "pending"
                                ? styles.stepCompleted
                                : styles.stepActive),
                            }}
                          >
                            {orderStatus !==
                            "pending"
                              ? "✓"
                              : "1"}
                          </div>

                          <span
                            style={
                              styles.stepText
                            }
                          >
                            Order Placed
                          </span>
                        </div>

                        {/* LINE */}

                        <div
                          style={
                            styles.progressLine
                          }
                        />

                        {/* STEP 2 */}

                        <div
                          style={
                            styles.progressStep
                          }
                        >
                          <div
                            style={{
                              ...styles.stepCircle,
                              ...(orderStatus ===
                                "confirmed" ||
                              orderStatus ===
                                "shipped" ||
                              orderStatus ===
                                "delivered"
                                ? styles.stepCompleted
                                : styles.stepInactive),
                            }}
                          >
                            {orderStatus ===
                              "confirmed" ||
                            orderStatus ===
                              "shipped" ||
                            orderStatus ===
                              "delivered"
                              ? "✓"
                              : "2"}
                          </div>

                          <span
                            style={
                              styles.stepText
                            }
                          >
                            Confirmed
                          </span>
                        </div>

                        {/* LINE */}

                        <div
                          style={
                            styles.progressLine
                          }
                        />

                        {/* STEP 3 */}

                        <div
                          style={
                            styles.progressStep
                          }
                        >
                          <div
                            style={{
                              ...styles.stepCircle,
                              ...(orderStatus ===
                                "shipped" ||
                              orderStatus ===
                                "delivered"
                                ? styles.stepCompleted
                                : styles.stepInactive),
                            }}
                          >
                            {orderStatus ===
                              "shipped" ||
                            orderStatus ===
                              "delivered"
                              ? "✓"
                              : "3"}
                          </div>

                          <span
                            style={
                              styles.stepText
                            }
                          >
                            Shipped
                          </span>
                        </div>

                        {/* LINE */}

                        <div
                          style={
                            styles.progressLine
                          }
                        />

                        {/* STEP 4 */}

                        <div
                          style={
                            styles.progressStep
                          }
                        >
                          <div
                            style={{
                              ...styles.stepCircle,
                              ...(orderStatus ===
                              "delivered"
                                ? styles.stepCompleted
                                : styles.stepInactive),
                            }}
                          >
                            {orderStatus ===
                            "delivered"
                              ? "✓"
                              : "4"}
                          </div>

                          <span
                            style={
                              styles.stepText
                            }
                          >
                            Delivered
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* ==================================
                        DELIVERY CONFIRMATION
                    ================================== */}

                    {canConfirmDelivery && (
                      <div
                        style={
                          styles.deliveryConfirmCard
                        }
                      >

                        <div>
                          <h3
                            style={
                              styles.deliveryTitle
                            }
                          >
                            📦 Order Received?
                          </h3>

                          <p
                            style={
                              styles.deliveryText
                            }
                          >
                            Your order has been
                            shipped. After you
                            receive the products,
                            confirm the delivery
                            below.
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            confirmDelivery(
                              order
                            )
                          }
                          disabled={isUpdating}
                          style={{
                            ...styles.confirmButton,
                            opacity: isUpdating
                              ? 0.7
                              : 1,
                            cursor: isUpdating
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {isUpdating
                            ? "Confirming..."
                            : "✓ Confirm Order Received"}
                        </button>

                      </div>
                    )}

                    {/* ==================================
                        DELIVERED MESSAGE
                    ================================== */}

                    {orderStatus ===
                      "delivered" && (
                      <div
                        style={
                          styles.deliveredCard
                        }
                      >
                        <div
                          style={
                            styles.deliveredIcon
                          }
                        >
                          ✓
                        </div>

                        <div>
                          <strong
                            style={
                              styles.deliveredTitle
                            }
                          >
                            Delivery Confirmed
                          </strong>

                          <p
                            style={
                              styles.deliveredText
                            }
                          >
                            You confirmed that
                            this order was
                            received successfully.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ==================================
                        DELIVERY ADDRESS
                    ================================== */}

                    <div
                      style={
                        styles.deliveryBox
                      }
                    >

                      <strong>
                        📍 Delivery Address
                      </strong>

                      <p
                        style={
                          styles.addressText
                        }
                      >
                        {order.delivery_address ||
                          "-"}
                      </p>

                      {(order.village ||
                        order.district) && (
                        <p
                          style={
                            styles.locationText
                          }
                        >
                          {order.village || ""}

                          {order.village &&
                          order.district
                            ? ", "
                            : ""}

                          {order.district || ""}
                        </p>
                      )}

                    </div>

                    {/* ==================================
                        CUSTOMER DETAILS
                    ================================== */}

                    <div
                      style={
                        styles.customerDetails
                      }
                    >

                      <div>
                        <span
                          style={styles.label}
                        >
                          Customer
                        </span>

                        <strong>
                          {order.customer_name ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={styles.label}
                        >
                          Phone
                        </span>

                        <strong>
                          {order.customer_phone ||
                            "-"}
                        </strong>
                      </div>

                    </div>

                    {/* ==================================
                        FOOTER
                    ================================== */}

                    <div
                      style={styles.footer}
                    >

                      <div>
                        <span
                          style={styles.footerLabel}
                        >
                          Created
                        </span>

                        <strong>
                          {formatDateTime(
                            order.created_at
                          )}
                        </strong>
                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/customer/orders/${order.id}`
                          )
                        }
                        style={
                          styles.viewButton
                        }
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

// ==================================================
// STYLES
// ==================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "35px 20px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  container: {
    maxWidth: "1050px",
    margin: "0 auto",
  },

  loadingCard: {
    maxWidth: "400px",
    margin: "100px auto",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "45px 25px",
    textAlign: "center",
    boxShadow:
      "0 2px 12px rgba(0,0,0,0.08)",
  },

  loadingIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  loadingTitle: {
    margin: "0 0 8px",
    color: "#1f2937",
  },

  loadingText: {
    margin: 0,
    color: "#6b7280",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },

  backButton: {
    display: "block",
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: "15px",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  title: {
    margin: 0,
    fontSize: "36px",
    color: "#1f2937",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },

  shopButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#1f7a3f",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  successMessage: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#047857",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontWeight: "600",
  },

  errorMessage: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontWeight: "600",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "65px 25px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "60px",
    marginBottom: "15px",
  },

  emptyTitle: {
    margin: "0 0 10px",
    color: "#1f2937",
  },

  emptyText: {
    color: "#6b7280",
    margin: "0 0 22px",
  },

  primaryButton: {
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    background: "#1f7a3f",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  orderCount: {
    marginBottom: "18px",
    color: "#555",
    fontSize: "15px",
  },

  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  orderCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "25px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    paddingBottom: "18px",
    borderBottom: "1px solid #eeeeee",
  },

  orderHeaderLeft: {
    minWidth: 0,
  },

  smallLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
  },

  orderId: {
    margin: "6px 0 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    wordBreak: "break-all",
  },

  orderDateBox: {
    textAlign: "right",
    flexShrink: 0,
  },

  orderDate: {
    margin: "6px 0 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },

  statusBanner: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "10px",
  },

  statusBannerTitle: {
    display: "block",
    fontSize: "16px",
  },

  statusBannerText: {
    margin: "5px 0 0",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  infoBox: {
    background: "#f8faf8",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    marginBottom: "5px",
  },

  totalAmount: {
    fontSize: "20px",
    color: "#166534",
  },

  badge: {
    display: "inline-block",
    width: "fit-content",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  progressSection: {
    marginTop: "22px",
    padding: "20px",
    background: "#fafafa",
    borderRadius: "12px",
    border: "1px solid #eeeeee",
  },

  progressTitle: {
    margin: "0 0 18px",
    fontSize: "17px",
    color: "#1f2937",
  },

  progressSteps: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    overflowX: "auto",
  },

  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "85px",
    textAlign: "center",
  },

  stepCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0,
  },

  stepActive: {
    background: "#166534",
    color: "#ffffff",
  },

  stepCompleted: {
    background: "#166534",
    color: "#ffffff",
  },

  stepInactive: {
    background: "#e5e7eb",
    color: "#6b7280",
  },

  stepText: {
    marginTop: "8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#4b5563",
  },

  progressLine: {
    height: "2px",
    background: "#d1d5db",
    flex: 1,
    minWidth: "25px",
    margin: "0 5px 25px",
  },

  deliveryConfirmCard: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "12px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  deliveryTitle: {
    margin: 0,
    color: "#92400e",
    fontSize: "18px",
  },

  deliveryText: {
    margin: "6px 0 0",
    color: "#78350f",
    fontSize: "13px",
    lineHeight: "1.5",
    maxWidth: "600px",
  },

  confirmButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#166534",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  deliveredCard: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "10px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  deliveredIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#047857",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  deliveredTitle: {
    display: "block",
    color: "#047857",
    fontSize: "15px",
  },

  deliveredText: {
    margin: "4px 0 0",
    color: "#065f46",
    fontSize: "13px",
  },

  deliveryBox: {
    marginTop: "20px",
    padding: "16px",
    background: "#f8f8f8",
    borderRadius: "10px",
  },

  addressText: {
    margin: "8px 0 0",
    color: "#555",
    lineHeight: "1.5",
  },

  locationText: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  customerDetails: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
    color: "#374151",
  },

  footer: {
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #eeeeee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
  },

  footerLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "11px",
    marginBottom: "5px",
  },

  viewButton: {
    padding: "10px 17px",
    border: "1px solid #1f7a3f",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#1f7a3f",
    fontWeight: "700",
    cursor: "pointer",
  },
};