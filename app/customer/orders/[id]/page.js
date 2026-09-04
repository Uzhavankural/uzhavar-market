"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /* =========================
         LOAD ORDER
      ========================= */

      const { data: orderData, error: orderError } =
        await supabase
          .from("orders")
          .select("*")
          .eq("id", params.id)
          .eq("customer_id", user.id)
          .single();

      if (orderError) {
        console.error(
          "Order fetch error:",
          orderError
        );

        setOrder(null);
        return;
      }

      setOrder(orderData);

      /* =========================
         LOAD ORDER ITEMS
      ========================= */

      const { data: itemsData, error: itemsError } =
        await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", params.id)
          .order("created_at", {
            ascending: true,
          });

      if (itemsError) {
        console.error(
          "Order items fetch error:",
          itemsError
        );

        setItems([]);
        return;
      }

      setItems(itemsData || []);
    } catch (error) {
      console.error(
        "Load order details error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatDateTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString(
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

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h2>Loading Order...</h2>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={notFoundStyle}>
            <div
              style={{
                fontSize: "55px",
                marginBottom: "15px",
              }}
            >
              📦
            </div>

            <h2>Order Not Found</h2>

            <p
              style={{
                color: "#666",
                marginBottom: "20px",
              }}
            >
              This order could not be found or you
              don't have permission to view it.
            </p>

            <button
              onClick={() =>
                router.push("/customer/orders")
              }
              style={primaryButtonStyle}
            >
              ← Back to My Orders
            </button>
          </div>
        </div>
      </main>
    );
  }

  const orderStatus =
    order.order_status || "pending";

  const paymentStatus =
    order.payment_status || "pending";

  const statusStyle =
    getStatusStyle(orderStatus);

  const paymentStyle =
    getPaymentStyle(paymentStatus);

  const totalAmount = Number(
    order.total_amount || 0
  );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* =========================
            HEADER
        ========================= */}

        <div style={headerStyle}>
          <div>
            <button
              onClick={() =>
                router.push("/customer/orders")
              }
              style={backButtonStyle}
            >
              ← My Orders
            </button>

            <h1
              style={{
                margin:
                  "18px 0 5px",
                fontSize: "30px",
              }}
            >
              Order Details
            </h1>

            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "14px",
                wordBreak: "break-all",
              }}
            >
              Order ID: {order.id}
            </p>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                ...badgeStyle,
                ...statusStyle,
                fontSize: "14px",
              }}
            >
              {orderStatus
                .charAt(0)
                .toUpperCase() +
                orderStatus.slice(1)}
            </div>

            <p
              style={{
                margin:
                  "8px 0 0",
                color: "#666",
                fontSize: "13px",
              }}
            >
              Ordered on{" "}
              {formatDate(
                order.created_at
              )}
            </p>
          </div>
        </div>

        {/* =========================
            ORDER STATUS
        ========================= */}

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Order Status
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",
              gap: "10px",
            }}
          >
            <StatusStep
              title="Order Placed"
              active={true}
              icon="📝"
            />

            <StatusStep
              title="Confirmed"
              active={[
                "confirmed",
                "shipped",
                "delivered",
              ].includes(orderStatus)}
              icon="✓"
            />

            <StatusStep
              title="Shipped"
              active={[
                "shipped",
                "delivered",
              ].includes(orderStatus)}
              icon="🚚"
            />

            <StatusStep
              title="Delivered"
              active={
                orderStatus === "delivered"
              }
              icon="📦"
            />
          </div>
        </section>

        {/* =========================
            ORDER ITEMS
        ========================= */}

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Ordered Products
          </h2>

          {items.length === 0 ? (
            <p style={{ color: "#666" }}>
              No order items found.
            </p>
          ) : (
            <div>
              {items.map((item) => {
                const price = Number(
                  item.price || 0
                );

                const quantity = Number(
                  item.quantity || 0
                );

                const itemTotal =
                  Number(
                    item.item_total
                  ) ||
                  price * quantity;

                return (
                  <div
                    key={item.id}
                    style={itemRowStyle}
                  >
                    <div
                      style={{
                        width: "55px",
                        height: "55px",
                        borderRadius: "8px",
                        background:
                          "#f0f0f0",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        fontSize: "25px",
                        flexShrink: 0,
                      }}
                    >
                      🌾
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            "0 0 5px",
                          fontSize:
                            "17px",
                        }}
                      >
                        {item.product_name}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: "#666",
                          fontSize:
                            "14px",
                        }}
                      >
                        ₹
                        {price.toFixed(
                          2
                        )} ×{" "}
                        {quantity}{" "}
                        {item.unit ||
                          "unit"}
                      </p>
                    </div>

                    <div
                      style={{
                        fontWeight:
                          "700",
                        fontSize:
                          "17px",
                      }}
                    >
                      ₹
                      {itemTotal.toFixed(
                        2
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total */}
          <div
            style={totalBoxStyle}
          >
            <span>Total Amount</span>

            <strong
              style={{
                fontSize: "23px",
              }}
            >
              ₹
              {totalAmount.toFixed(
                2
              )}
            </strong>
          </div>
        </section>

        {/* =========================
            DELIVERY DETAILS
        ========================= */}

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "20px",
            }}
          >
            Delivery Details
          </h2>

          <div
            style={detailsGridStyle}
          >
            <Detail
              label="Customer Name"
              value={
                order.customer_name
              }
            />

            <Detail
              label="Phone Number"
              value={
                order.customer_phone
              }
            />

            <Detail
              label="Delivery Address"
              value={
                order.delivery_address
              }
            />

            <Detail
              label="Village"
              value={
                order.village
              }
            />

            <Detail
              label="District"
              value={
                order.district
              }
            />

            <Detail
              label="Order Date"
              value={formatDateTime(
                order.created_at
              )}
            />
          </div>
        </section>

        {/* =========================
            PAYMENT
        ========================= */}

        <section style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            Payment Information
          </h2>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "15px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#666",
                  fontSize:
                    "13px",
                }}
              >
                Payment Status
              </p>

              <span
                style={{
                  ...badgeStyle,
                  ...paymentStyle,
                  marginTop:
                    "7px",
                }}
              >
                {paymentStatus
                  .charAt(0)
                  .toUpperCase() +
                  paymentStatus.slice(
                    1
                  )}
              </span>
            </div>

            <div
              style={{
                textAlign:
                  "right",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#666",
                  fontSize:
                    "13px",
                }}
              >
                Amount
              </p>

              <strong
                style={{
                  fontSize:
                    "20px",
                }}
              >
                ₹
                {totalAmount.toFixed(
                  2
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* =========================
            BUTTONS
        ========================= */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent:
              "center",
            flexWrap: "wrap",
            marginTop: "10px",
          }}
        >
          <button
            onClick={() =>
              router.push(
                "/customer/products"
              )
            }
            style={
              primaryButtonStyle
            }
          >
            🛒 Continue Shopping
          </button>

          <button
            onClick={() =>
              router.push(
                "/customer/orders"
              )
            }
            style={
              secondaryButtonStyle
            }
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================
   STATUS STEP
========================= */

function StatusStep({
  title,
  active,
  icon,
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 5px",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          margin: "0 auto 8px",
          borderRadius: "50%",
          background: active
            ? "#1f7a3f"
            : "#ddd",
          color: active
            ? "white"
            : "#777",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "700",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "13px",
          fontWeight: active
            ? "700"
            : "500",
          color: active
            ? "#1f7a3f"
            : "#777",
        }}
      >
        {title}
      </div>
    </div>
  );
}

/* =========================
   DETAIL
========================= */

function Detail({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: "14px",
        background: "#f8f8f8",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          color: "#666",
          fontSize: "13px",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "600",
          wordBreak:
            "break-word",
        }}
      >
        {value || "-"}
      </div>
    </div>
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
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "25px",
};

const cardStyle = {
  background: "white",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "22px",
  marginBottom: "20px",
};

const backButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: "#1f7a3f",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "14px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const itemRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "15px 0",
  borderBottom: "1px solid #eee",
};

const totalBoxStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "18px",
  paddingTop: "18px",
  borderTop: "2px solid #eee",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, 1fr)",
  gap: "12px",
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

const secondaryButtonStyle = {
  padding: "12px 22px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  background: "white",
  color: "#333",
  fontWeight: "600",
  cursor: "pointer",
};

const notFoundStyle = {
  background: "white",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "50px 25px",
  textAlign: "center",
};