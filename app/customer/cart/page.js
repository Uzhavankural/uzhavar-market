"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerCartPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER + CART
  // =========================
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

  // =========================
  // SAVE CART
  // =========================
  useEffect(() => {
    if (!user) return;

    localStorage.setItem(
      `uzhavar_cart_${user.id}`,
      JSON.stringify(cart)
    );
  }, [cart, user]);

  // =========================
  // UPDATE QUANTITY
  // =========================
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cart[index];

    if (
      item.stock_quantity !== null &&
      newQuantity > Number(item.stock_quantity)
    ) {
      alert(`Only ${item.stock_quantity} ${item.unit || "unit"} available.`);
      return;
    }

    const updatedCart = [...cart];

    updatedCart[index] = {
      ...updatedCart[index],
      quantity: newQuantity,
    };

    setCart(updatedCart);
  };

  // =========================
  // REMOVE ITEM
  // =========================
  const removeItem = (index) => {
    const item = cart[index];

    const confirmRemove = confirm(
      `Remove "${item.name}" from cart?`
    );

    if (!confirmRemove) return;

    const updatedCart = cart.filter((_, i) => i !== index);

    setCart(updatedCart);
  };

  // =========================
  // CLEAR CART
  // =========================
  const clearCart = () => {
    if (cart.length === 0) return;

    const confirmClear = confirm(
      "Are you sure you want to clear the cart?"
    );

    if (!confirmClear) return;

    setCart([]);
  };

  // =========================
  // CALCULATIONS
  // =========================
  const getItemPrice = (item) => {
    return (
      Number(item.price || 0) +
      Number(item.commission_amount || 0)
    );
  };

  const getItemTotal = (item) => {
    return getItemPrice(item) * Number(item.quantity || 1);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + getItemTotal(item),
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );

  // =========================
  // CHECKOUT
  // =========================
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    router.push("/customer/checkout");
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f8f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading cart...</p>
      </main>
    );
  }

  // =========================
  // EMPTY CART
  // =========================
  if (cart.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f8f5",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => router.push("/customer/products")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "16px",
              marginBottom: "30px",
            }}
          >
            ← Continue Shopping
          </button>

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "60px 20px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                fontSize: "70px",
                marginBottom: "15px",
              }}
            >
              🛒
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                fontSize: "30px",
              }}
            >
              Your Cart is Empty
            </h1>

            <p
              style={{
                color: "#666",
                marginBottom: "25px",
              }}
            >
              Add fresh products from our farmers to your cart.
            </p>

            <button
              onClick={() => router.push("/customer/products")}
              style={{
                background: "#2e7d32",
                color: "#fff",
                border: "none",
                padding: "13px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Browse Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // CART PAGE
  // =========================
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f8f5",
        padding: "30px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div>
            <button
              onClick={() => router.push("/customer/products")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "15px",
                padding: 0,
                marginBottom: "10px",
              }}
            >
              ← Continue Shopping
            </button>

            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              🛒 My Cart
            </h1>

            <p
              style={{
                color: "#666",
                marginTop: "8px",
              }}
            >
              {totalItems} item{totalItems !== 1 ? "s" : ""} in your cart
            </p>
          </div>

          <button
            onClick={clearCart}
            style={{
              background: "#fff",
              color: "#d32f2f",
              border: "1px solid #d32f2f",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Clear Cart
          </button>
        </div>

        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: "25px",
            alignItems: "start",
          }}
        >
          {/* CART ITEMS */}
          <div>
            {cart.map((item, index) => {
              const price = getItemPrice(item);
              const itemTotal = getItemTotal(item);

              return (
                <div
                  key={`${item.id}-${index}`}
                  style={{
                    background: "#fff",
                    borderRadius: "14px",
                    padding: "18px",
                    marginBottom: "15px",
                    boxShadow: "0 3px 15px rgba(0,0,0,0.07)",
                    display: "flex",
                    gap: "18px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {/* IMAGE */}
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#eee",
                      flexShrink: 0,
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "35px",
                        }}
                      >
                        🌾
                      </div>
                    )}
                  </div>

                  {/* PRODUCT INFO */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: "220px",
                    }}
                  >
                    <h2
                      style={{
                        margin: "0 0 8px",
                        fontSize: "20px",
                      }}
                    >
                      {item.name}
                    </h2>

                    {item.farm_name && (
                      <p
                        style={{
                          margin: "4px 0",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        🌱 {item.farm_name}
                      </p>
                    )}

                    <p
                      style={{
                        margin: "8px 0",
                        fontWeight: "bold",
                        color: "#2e7d32",
                      }}
                    >
                      ₹{price.toFixed(2)} / {item.unit || "unit"}
                    </p>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#777",
                      }}
                    >
                      Stock: {item.stock_quantity ?? "Available"}
                    </p>
                  </div>

                  {/* QUANTITY */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(
                          index,
                          Number(item.quantity || 1) - 1
                        )
                      }
                      disabled={Number(item.quantity || 1) <= 1}
                      style={{
                        width: "34px",
                        height: "34px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        background: "#fff",
                        cursor:
                          Number(item.quantity || 1) <= 1
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "18px",
                      }}
                    >
                      −
                    </button>

                    <span
                      style={{
                        minWidth: "25px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          index,
                          Number(item.quantity || 1) + 1
                        )
                      }
                      style={{
                        width: "34px",
                        height: "34px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* ITEM TOTAL */}
                  <div
                    style={{
                      minWidth: "110px",
                      textAlign: "right",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      ₹{itemTotal.toFixed(2)}
                    </p>

                    <button
                      onClick={() => removeItem(index)}
                      style={{
                        marginTop: "8px",
                        border: "none",
                        background: "transparent",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "22px",
              boxShadow: "0 3px 15px rgba(0,0,0,0.07)",
              position: "sticky",
              top: "20px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "22px",
              }}
            >
              Order Summary
            </h2>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                color: "#555",
              }}
            >
              <span>Items</span>
              <span>{totalItems}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
                color: "#555",
              }}
            >
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "15px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                fontSize: "20px",
                fontWeight: "bold",
              }}
            >
              <span>Total</span>
              <span style={{ color: "#2e7d32" }}>
                ₹{cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: "100%",
                background: "#2e7d32",
                color: "#fff",
                border: "none",
                padding: "14px",
                borderRadius: "9px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Proceed to Checkout →
            </button>

            <button
              onClick={() => router.push("/customer/products")}
              style={{
                width: "100%",
                marginTop: "10px",
                background: "#fff",
                color: "#2e7d32",
                border: "1px solid #2e7d32",
                padding: "12px",
                borderRadius: "9px",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}