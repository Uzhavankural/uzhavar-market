"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Orders fetch error:", error);
        alert("Unable to load your orders.");
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Load orders error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case "pending":
        return {
          background: "#fff3cd",
          color: "#856404",
        };

      case "confirmed":
        return {
          background: "#cfe2ff",
          color: "#084298",
        };

      case "shipped":
        return {
          background: "#e2d9f3",
          color: "#59359a",
        };

      case "delivered":
        return {
          background: "#d1e7dd",
          color: "#0f5132",
        };

      case "cancelled":
        return {
          background: "#f8d7da",
          color: "#842029",
        };

      default:
        return {
          background: "#e9ecef",
          color: "#495057",
        };
    }
  }

  function getPaymentStyle(status) {
    if (status === "paid") {
      return {
        background: "#d1e7dd",
        color: "#0f5132",
      };
    }

    return {
      background: "#fff3cd",
      color: "#856404",
    };
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h2>Loading Orders...</h2>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              My Orders
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#666",
              }}
            >
              Track your orders and delivery status
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/customer/products")
            }
            style={shopButtonStyle}
          >
            🛒 Continue Shopping
          </button>
        </div>

        {/* Empty Orders */}
        {orders.length === 0 ? (
          <div style={emptyStyle}>
            <div
              style={{
                fontSize: "60px",
                marginBottom: "15px",
              }}
            >
              📦
            </div>

            <h2>No Orders Yet</h2>

            <p
              style={{
                color: "#666",
                marginBottom: "20px",
              }}
            >
              You haven't placed any orders yet.
            </p>

            <button
              onClick={() =>
                router.push("/customer/products")
              }
              style={primaryButtonStyle}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            {/* Order Count */}
            <div
              style={{
                marginBottom: "20px",
                color: "#555",
              }}
            >
              <strong>
                {orders.length}
              </strong>{" "}
              {orders.length === 1
                ? "Order"
                : "Orders"}
            </div>

            {/* Orders */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {orders.map((order) => {
                const orderStatus =
                  order.order_status || "pending";

                const paymentStatus =
                  order.payment_status || "pending";

                const statusStyle =
                  getStatusStyle(orderStatus);

                const paymentStyle =
                  getPaymentStyle(paymentStatus);

                return (
                  <div
                    key={order.id}
                    style={orderCardStyle}
                  >
                    {/* Order Header */}
                    <div style={orderHeaderStyle}>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: "#666",
                            fontSize: "13px",
                          }}
                        >
                          ORDER ID
                        </p>

                        <p
                          style={{
                            margin: "5px 0 0",
                            fontWeight: "600",
                            fontSize: "14px",
                            wordBreak: "break-all",
                          }}
                        >
                          {order.id}
                        </p>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: "#666",
                            fontSize: "13px",
                          }}
                        >
                          ORDER DATE
                        </p>

                        <p
                          style={{
                            margin: "5px 0 0",
                            fontWeight: "600",
                          }}
                        >
                          {formatDate(
                            order.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div style={infoGridStyle}>
                      <div style={infoBoxStyle}>
                        <span
                          style={labelStyle}
                        >
                          Total Amount
                        </span>

                        <strong
                          style={{
                            fontSize: "20px",
                          }}
                        >
                          ₹
                          {Number(
                            order.total_amount || 0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div style={infoBoxStyle}>
                        <span
                          style={labelStyle}
                        >
                          Order Status
                        </span>

                        <span
                          style={{
                            ...badgeStyle,
                            ...statusStyle,
                          }}
                        >
                          {orderStatus
                            .charAt(0)
                            .toUpperCase() +
                            orderStatus.slice(1)}
                        </span>
                      </div>

                      <div style={infoBoxStyle}>
                        <span
                          style={labelStyle}
                        >
                          Payment
                        </span>

                        <span
                          style={{
                            ...badgeStyle,
                            ...paymentStyle,
                          }}
                        >
                          {paymentStatus
                            .charAt(0)
                            .toUpperCase() +
                            paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div
                      style={{
                        marginTop: "18px",
                        padding: "15px",
                        background: "#f8f8f8",
                        borderRadius: "8px",
                      }}
                    >
                      <strong>
                        📍 Delivery Address
                      </strong>

                      <p
                        style={{
                          margin:
                            "7px 0 0",
                          color: "#555",
                        }}
                      >
                        {order.delivery_address ||
                          "-"}
                      </p>

                      {(order.village ||
                        order.district) && (
                        <p
                          style={{
                            margin:
                              "5px 0 0",
                            color: "#666",
                            fontSize:
                              "14px",
                          }}
                        >
                          {order.village
                            ? `${order.village}`
                            : ""}
                          {order.village &&
                          order.district
                            ? ", "
                            : ""}
                          {order.district
                            ? `${order.district}`
                            : ""}
                        </p>
                      )}
                    </div>

                    {/* Customer */}
                    <div
                      style={{
                        marginTop: "15px",
                        color: "#555",
                        fontSize: "14px",
                      }}
                    >
                      <strong>
                        Customer:
                      </strong>{" "}
                      {order.customer_name ||
                        "-"}
                      {"  "} | {"  "}
                      <strong>
                        Phone:
                      </strong>{" "}
                      {order.customer_phone ||
                        "-"}
                    </div>

                    {/* Footer */}
                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "15px",
                        borderTop:
                          "1px solid #eee",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#666",
                          fontSize: "13px",
                        }}
                      >
                        Uzhavar Market 🌾
                      </span>

                      <button
                        onClick={() =>
                          router.push(
                            `/customer/orders/${order.id}`
                          )
                        }
                        style={
                          viewButtonStyle
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

/* =========================
   STYLES
========================= */

const pageStyle = {
  minHeight: "100vh",
  background: "#f7f7f7",
  padding: "30px 20px",
};

const containerStyle = {
  maxWidth: "1000px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  flexWrap: "wrap",
  marginBottom: "30px",
};

const shopButtonStyle = {
  padding: "11px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#1f7a3f",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};

const emptyStyle = {
  background: "white",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
  padding: "50px 25px",
  textAlign: "center",
};

const primaryButtonStyle = {
  padding: "12px 22px",
  border: "none",
  borderRadius: "8px",
  background: "#1f7a3f",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};

const orderCardStyle = {
  background: "white",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "22px",
};

const orderHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
  paddingBottom: "15px",
  borderBottom: "1px solid #eee",
};

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, 1fr)",
  gap: "12px",
  marginTop: "18px",
};

const infoBoxStyle = {
  background: "#f8f8f8",
  padding: "14px",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  color: "#666",
  fontSize: "13px",
};

const badgeStyle = {
  display: "inline-block",
  width: "fit-content",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const viewButtonStyle = {
  padding: "9px 16px",
  border: "1px solid #1f7a3f",
  borderRadius: "7px",
  background: "white",
  color: "#1f7a3f",
  fontWeight: "600",
  cursor: "pointer",
};