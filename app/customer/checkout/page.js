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

    try {
      setPlacingOrder(true);

      /*
       * STEP 1
       * Check current stock for every product
       */
      for (const item of cart) {
        const { data: product, error: productError } =
          await supabase
            .from("products")
            .select("id, name, stock_quantity, status, approval_status")
            .eq("id", item.id)
            .single();

        if (productError || !product) {
          throw new Error(
            `${item.name} is no longer available.`
          );
        }

        if (
          product.approval_status !== "active" ||
          product.status !== "active"
        ) {
          throw new Error(
            `${item.name} is currently unavailable.`
          );
        }

        const currentStock = Number(
          product.stock_quantity || 0
        );

        const requestedQuantity = Number(
          item.quantity || 0
        );

        if (currentStock < requestedQuantity) {
          throw new Error(
            `Only ${currentStock} ${item.unit || "unit"} of ${item.name} is available.`
          );
        }
      }

      /*
       * STEP 2
       * Create order
       */
      const { data: order, error: orderError } =
        await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            customer_name: customerName.trim(),
            customer_phone: phone.trim(),
            delivery_address: address.trim(),
            district: district.trim(),
            village: village.trim(),
            total_amount: cartTotal,
            order_status: "pending",
            payment_status: "pending",
          })
          .select()
          .single();

      if (orderError) {
        console.error("Order insert error:", orderError);
        throw new Error(
          orderError.message || "Failed to create order."
        );
      }

      /*
       * STEP 3
       * Create order items
       */
      const orderItems = cart.map((item) => {
        const farmerPrice = Number(item.price || 0);
        const commissionAmount = Number(
          item.commission_amount || 0
        );
        const quantity = Number(item.quantity || 0);

        const customerPrice =
          farmerPrice + commissionAmount;

        const itemTotal =
          customerPrice * quantity;

        const farmerAmount =
          farmerPrice * quantity;

        return {
          order_id: order.id,
          product_id: item.id,
          farmer_id: item.farmer_id,
          product_name: item.name,
          price: customerPrice,
          quantity: quantity,
          unit: item.unit || "unit",
          item_total: itemTotal,

          settlement_status: "pending",
          settlement_amount: farmerAmount,
          settlement_paid_at: null,

          commission_amount: commissionAmount,
          farmer_price: farmerPrice,
        };
      });

      const { error: itemsError } =
        await supabase
          .from("order_items")
          .insert(orderItems);

      if (itemsError) {
        console.error(
          "Order items insert error:",
          itemsError
        );

        // Remove order if items could not be created
        await supabase
          .from("orders")
          .delete()
          .eq("id", order.id);

        throw new Error(
          itemsError.message ||
            "Failed to create order items."
        );
      }

      /*
       * STEP 4
       * Reduce product stock
       */
      for (const item of cart) {
        const { data: product, error: stockFetchError } =
          await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.id)
            .single();

        if (stockFetchError || !product) {
          console.error(
            "Stock fetch error:",
            stockFetchError
          );
          continue;
        }

        const currentStock = Number(
          product.stock_quantity || 0
        );

        const newStock =
          currentStock - Number(item.quantity || 0);

        const { error: stockUpdateError } =
          await supabase
            .from("products")
            .update({
              stock_quantity: Math.max(0, newStock),
            })
            .eq("id", item.id);

        if (stockUpdateError) {
          console.error(
            "Stock update error:",
            stockUpdateError
          );
        }
      }

      /*
       * STEP 5
       * Clear cart
       */
      localStorage.removeItem(
        `uzhavar_cart_${user.id}`
      );

      /*
       * STEP 6
       * Go to success page
       */
      router.push(
        `/customer/order-success?order_id=${order.id}`
      );
    } catch (error) {
      console.error("Place order error:", error);

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
                  setCustomerName(e.target.value)
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
              <label>Delivery Address</label>

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
                    setDistrict(e.target.value)
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
                    setVillage(e.target.value)
                  }
                  placeholder="Village"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Payment */}
            <div style={paymentBoxStyle}>
              <h3 style={{ marginTop: 0 }}>
                Payment Method
              </h3>

              <div style={paymentMethodStyle}>
                <strong>Cash on Delivery</strong>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#666",
                    fontSize: "14px",
                  }}
                >
                  Pay when your order is delivered.
                </p>
              </div>
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
                    <span style={{ fontSize: "25px" }}>
                      🌾
                    </span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 5px" }}>
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
                    {getItemTotal(item).toFixed(2)}
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
                opacity: placingOrder ? 0.7 : 1,
                cursor: placingOrder
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {placingOrder
                ? "Placing Order..."
                : `Place Order • ₹${cartTotal.toFixed(2)}`}
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

const paymentMethodStyle = {
  padding: "12px",
  background: "white",
  borderRadius: "8px",
  border: "1px solid #ddd",
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
