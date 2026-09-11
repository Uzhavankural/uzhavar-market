"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadCheckout();
  }, []);

  async function loadCheckout() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const cartKey = `uzhavar_cart_${user.id}`;
      const savedCart = localStorage.getItem(cartKey);

      if (!savedCart) {
        router.push("/customer/cart");
        return;
      }

      let parsedCart = [];

      try {
        parsedCart = JSON.parse(savedCart);
      } catch (error) {
        console.error("Cart parse error:", error);
      }

      if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
        router.push("/customer/cart");
        return;
      }

      setCart(parsedCart);

      // Load customer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setCustomerName(profile.full_name || "");
        setPhone(profile.phone || profile.mobile || "");
        setAddress(profile.address || "");
        setDistrict(profile.district || "");
        setVillage(profile.village || "");
      }
    } catch (error) {
      console.error("Checkout loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getCustomerPrice(item) {
    return (
      Number(item.price || 0) +
      Number(item.commission_amount || 0)
    );
  }

  function getItemTotal(item) {
    return (
      getCustomerPrice(item) *
      Number(item.quantity || 0)
    );
  }

  const cartTotal = cart.reduce(
    (total, item) => total + getItemTotal(item),
    0
  );

  async function handlePlaceOrder() {
    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (!district.trim()) {
      alert("Please enter your district.");
      return;
    }

    if (!village.trim()) {
      alert("Please enter your village.");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      router.push("/customer/cart");
      return;
    }

    if (!user) {
      alert("Please login again.");
      router.push("/login");
      return;
    }

    try {
      setPlacingOrder(true);

      /*
       * IMPORTANT
       *
       * Stock checking, order creation,
       * order item creation and stock reduction
       * are now handled inside ONE Supabase
       * database transaction.
       *
       * We intentionally do NOT send:
       * - price
       * - farmer_price
       * - commission_amount
       * - farmer_id
       * - item_total
       * - settlement_amount
       *
       * as authoritative financial values.
       *
       * The database gets those values directly
       * from the products table.
       */

      const cartPayload = cart.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity || 0),
      }));

      const { data: orderId, error: orderError } =
        await supabase.rpc("place_customer_order", {
          p_customer_id: user.id,
          p_customer_name: customerName.trim(),
          p_customer_phone: phone.trim(),
          p_delivery_address: address.trim(),
          p_district: district.trim(),
          p_village: village.trim(),
          p_cart: cartPayload,
        });

      if (orderError) {
        console.error(
          "Place order RPC error:",
          orderError
        );

        throw new Error(
          orderError.message ||
            "Failed to place order."
        );
      }

      if (!orderId) {
        throw new Error(
          "Order was not created. Please try again."
        );
      }

      /*
       * Clear cart only AFTER
       * successful database transaction.
       */
      localStorage.removeItem(
        `uzhavar_cart_${user.id}`
      );

      /*
       * Go to success page
       */
      router.push(
        `/customer/order-success?order_id=${orderId}`
      );
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while placing your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h2>Loading Checkout...</h2>
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
            <h1 style={{ margin: 0 }}>
              Checkout
            </h1>

            <p style={{ color: "#666" }}>
              Complete your delivery details
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/customer/cart")
            }
            style={backButtonStyle}
          >
            ← Back to Cart
          </button>
        </div>

        <div style={gridStyle}>

          {/* Delivery Details */}
          <section style={cardStyle}>
            <h2>Delivery Details</h2>

            <div style={fieldStyle}>
              <label>Full Name</label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
                placeholder="Enter your name"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>Phone Number</label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter phone number"
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label>
                Delivery Address
              </label>

              <textarea
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="House / Street / Area"
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={twoColumnStyle}>
              <div style={fieldStyle}>
                <label>District</label>

                <input
                  type="text"
                  value={district}
                  onChange={(e) =>
                    setDistrict(
                      e.target.value
                    )
                  }
                  placeholder="District"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label>Village</label>

                <input
                  type="text"
                  value={village}
                  onChange={(e) =>
                    setVillage(
                      e.target.value
                    )
                  }
                  placeholder="Village"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div style={paymentBoxStyle}>
              <h3 style={{ marginTop: 0 }}>
                Payment Method
              </h3>

              <div
                style={
                  paymentMethodUnavailableStyle
                }
              >
                <div>
                  <strong
                    style={{
                      color: "#777",
                    }}
                  >
                    💵 Cash on Delivery
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#888",
                      fontSize: "14px",
                    }}
                  >
                    Currently unavailable
                  </p>
                </div>

                <span
                  style={
                    unavailableBadgeStyle
                  }
                >
                  Unavailable
                </span>
              </div>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#777",
                  fontSize: "13px",
                }}
              >
                Online payment will be
                available soon.
              </p>
            </div>
          </section>

          {/* Order Summary */}
          <section style={cardStyle}>
            <h2>Order Summary</h2>

            {cart.map((item) => (
              <div
                key={item.id}
                style={itemStyle}
              >
                <div style={imageBoxStyle}>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      style={imageStyle}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "25px",
                      }}
                    >
                      🌾
                    </span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 5px",
                    }}
                  >
                    {item.name}
                  </h4>

                  <p
                    style={{
                      margin: "0 0 5px",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    Qty: {item.quantity}{" "}
                    {item.unit || "unit"}
                  </p>

                  <strong>
                    ₹
                    {getItemTotal(
                      item
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>
            ))}

            <div style={summaryRowStyle}>
              <span>Products</span>
              <span>{cart.length}</span>
            </div>

            <div style={summaryRowStyle}>
              <span>Delivery</span>
              <span>Free</span>
            </div>

            <div style={totalStyle}>
              <span>Total</span>

              <span>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              style={{
                ...placeOrderButtonStyle,
                opacity: placingOrder
                  ? 0.7
                  : 1,
                cursor: placingOrder
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {placingOrder
                ? "Placing Order..."
                : `Place Order • ₹${cartTotal.toFixed(
                    2
                  )}`}
            </button>
          </section>
        </div>
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
  maxWidth: "1100px",
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: "25px",
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
  height: "fit-content",
};

const fieldStyle = {
  marginBottom: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "7px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
};

const backButtonStyle = {
  padding: "10px 18px",
  border: "1px solid #ccc",
  background: "white",
  borderRadius: "8px",
  cursor: "pointer",
};

const paymentBoxStyle = {
  marginTop: "25px",
  padding: "18px",
  background: "#f8f8f8",
  borderRadius: "10px",
  border: "1px solid #e5e5e5",
};

const paymentMethodUnavailableStyle = {
  padding: "14px",
  background: "#f5f5f5",
  borderRadius: "8px",
  border: "1px solid #ddd",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  opacity: 0.8,
};

const unavailableBadgeStyle = {
  padding: "5px 9px",
  borderRadius: "6px",
  background: "#e9e9e9",
  color: "#777",
  fontSize: "12px",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const itemStyle = {
  display: "flex",
  gap: "12px",
  paddingBottom: "15px",
  marginBottom: "15px",
  borderBottom: "1px solid #eee",
};

const imageBoxStyle = {
  width: "65px",
  height: "65px",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#eee",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const totalStyle = {
  borderTop: "1px solid #ddd",
  paddingTop: "15px",
  marginTop: "15px",
  display: "flex",
  justifyContent: "space-between",
  fontSize: "20px",
  fontWeight: "700",
};

const placeOrderButtonStyle = {
  width: "100%",
  marginTop: "22px",
  padding: "14px",
  border: "none",
  borderRadius: "8px",
  background: "#1f7a3f",
  color: "white",
  fontSize: "16px",
  fontWeight: "700",
};