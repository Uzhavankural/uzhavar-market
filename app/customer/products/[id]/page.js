"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadProduct();
    }
  }, [params?.id]);

  // =========================
  // LOAD PRODUCT
  // =========================
  async function loadProduct() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        profiles (
          full_name,
          farm_name
        ),
        categories (
          name
        )
      `)
      .eq("id", params.id)
      .eq("approval_status", "active")
      .eq("status", "active")
      .single();

    if (error) {
      console.error("Product loading error:", error);
      setProduct(null);
    } else {
      setProduct(data);
    }

    setLoading(false);
  }

  // =========================
  // CUSTOMER PRICE
  // =========================
  function getCustomerPrice() {
    if (!product) return 0;

    const farmerPrice = Number(product.price || 0);
    const commission = Number(product.commission_amount || 0);

    return farmerPrice + commission;
  }

  // =========================
  // INCREASE QUANTITY
  // =========================
  function increaseQuantity() {
    if (!product) return;

    const stock = Number(product.stock_quantity || 0);

    if (quantity < stock) {
      setQuantity((previous) => previous + 1);
    }
  }

  // =========================
  // DECREASE QUANTITY
  // =========================
  function decreaseQuantity() {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  }

  // =========================
  // ADD TO CART
  // =========================
  async function handleAddToCart() {
    if (!product || addingToCart) return;

    const stock = Number(product.stock_quantity || 0);

    // Stock validation
    if (stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (quantity > stock) {
      alert("Selected quantity is not available.");
      return;
    }

    setAddingToCart(true);

    try {
      // =========================
      // CHECK LOGIN
      // =========================
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please login to add products to cart.");
        router.push("/login");
        return;
      }

      // =========================
      // USER-SPECIFIC CART
      // =========================
      const cartKey = `uzhavar_cart_${user.id}`;

      // Get existing cart
      const savedCart = localStorage.getItem(cartKey);

      let cart = [];

      try {
        cart = savedCart ? JSON.parse(savedCart) : [];

        if (!Array.isArray(cart)) {
          cart = [];
        }
      } catch (error) {
        console.error("Cart parse error:", error);
        cart = [];
      }

      // =========================
      // CHECK EXISTING PRODUCT
      // =========================
      const existingIndex = cart.findIndex(
        (item) => String(item.id) === String(product.id)
      );

      if (existingIndex !== -1) {
        const existingQuantity = Number(
          cart[existingIndex].quantity || 0
        );

        const newQuantity = existingQuantity + quantity;

        // Combined quantity cannot exceed stock
        if (newQuantity > stock) {
          alert(
            `Only ${stock} ${
              product.unit || "unit"
            } available in stock.`
          );
          return;
        }

        // Update existing item
        cart[existingIndex] = {
          ...cart[existingIndex],
          quantity: newQuantity,
          stock_quantity: stock,
          price: Number(product.price || 0),
          commission_amount: Number(
            product.commission_amount || 0
          ),
          unit: product.unit || "unit",
          image_url: product.image_url || null,
          farmer_id: product.farmer_id,
          farm_name:
            product.profiles?.farm_name ||
            product.profiles?.full_name ||
            "Local Farmer",
          category_name:
            product.categories?.name || "General",
        };
      } else {
        // =========================
        // ADD NEW PRODUCT
        // =========================
        cart.push({
          id: product.id,
          name: product.name,
          description: product.description || "",

          // Farmer price
          price: Number(product.price || 0),

          // Platform commission
          commission_amount: Number(
            product.commission_amount || 0
          ),

          unit: product.unit || "unit",
          image_url: product.image_url || null,
          stock_quantity: stock,

          farmer_id: product.farmer_id,

          farm_name:
            product.profiles?.farm_name ||
            product.profiles?.full_name ||
            "Local Farmer",

          category_name:
            product.categories?.name || "General",

          quantity: quantity,
        });
      }

      // =========================
      // SAVE CART
      // =========================
      localStorage.setItem(
        cartKey,
        JSON.stringify(cart)
      );

      // =========================
      // SUCCESS
      // =========================
      alert(
        `${product.name} added to cart successfully!`
      );

      router.push("/customer/cart");
    } catch (error) {
      console.error("Add to cart error:", error);

      alert(
        "Something went wrong while adding the product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.message}>
          <h2>Loading product...</h2>
          <p>Please wait.</p>
        </div>
      </main>
    );
  }

  // =========================
  // PRODUCT NOT FOUND
  // =========================
  if (!product) {
    return (
      <main style={styles.page}>
        <div style={styles.message}>
          <h2>Product not found</h2>

          <p>
            This product may have been removed or is no longer
            available.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              router.push("/customer/products")
            }
          >
            ← Back to Products
          </button>
        </div>
      </main>
    );
  }

  const customerPrice = getCustomerPrice();
  const stock = Number(product.stock_quantity || 0);
  const totalPrice = customerPrice * quantity;

  const farmerName =
    product.profiles?.farm_name ||
    product.profiles?.full_name ||
    "Local Farmer";

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* =========================
            TOP NAVIGATION
        ========================= */}
        <div style={styles.topBar}>
          <button
            style={styles.backButton}
            onClick={() =>
              router.push("/customer/products")
            }
          >
            ← Back to Products
          </button>

          <button
            style={styles.dashboardButton}
            onClick={() =>
              router.push("/customer")
            }
          >
            Dashboard
          </button>
        </div>

        {/* =========================
            PRODUCT DETAILS
        ========================= */}
        <section style={styles.productSection}>

          {/* PRODUCT IMAGE */}
          <div style={styles.imageSection}>
            <div style={styles.imageBox}>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={styles.productImage}
                />
              ) : (
                <div style={styles.noImage}>
                  🌾
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT INFORMATION */}
          <div style={styles.detailsSection}>

            {/* CATEGORY */}
            <div style={styles.categoryBadge}>
              {product.categories?.name || "General"}
            </div>

            {/* PRODUCT NAME */}
            <h1 style={styles.title}>
              {product.name}
            </h1>

            {/* DESCRIPTION */}
            <p style={styles.description}>
              {product.description ||
                "Fresh farm product"}
            </p>

            {/* FARMER */}
            <div style={styles.infoBox}>
              <div style={styles.infoLabel}>
                👨‍🌾 Farmer
              </div>

              <div style={styles.infoValue}>
                {farmerName}
              </div>
            </div>

            {/* PRICE */}
            <div style={styles.priceBox}>
              <span style={styles.price}>
                ₹{customerPrice.toFixed(2)}
              </span>

              <span style={styles.unit}>
                / {product.unit || "unit"}
              </span>
            </div>

            {/* STOCK */}
            <div
              style={{
                ...styles.stock,
                color:
                  stock > 0
                    ? "#26733a"
                    : "#b42318",
              }}
            >
              {stock > 0
                ? `✓ ${stock} available`
                : "Out of Stock"}
            </div>

            {/* AVAILABLE PRODUCT */}
            {stock > 0 && (
              <>
                {/* QUANTITY */}
                <div style={styles.quantitySection}>
                  <div style={styles.quantityLabel}>
                    Quantity
                  </div>

                  <div style={styles.quantityControls}>

                    <button
                      style={{
                        ...styles.quantityButton,
                        opacity:
                          quantity <= 1 ? 0.5 : 1,
                        cursor:
                          quantity <= 1
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>

                    <span style={styles.quantityValue}>
                      {quantity}
                    </span>

                    <button
                      style={{
                        ...styles.quantityButton,
                        opacity:
                          quantity >= stock
                            ? 0.5
                            : 1,
                        cursor:
                          quantity >= stock
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={increaseQuantity}
                      disabled={quantity >= stock}
                    >
                      +
                    </button>

                  </div>
                </div>

                {/* TOTAL */}
                <div style={styles.totalBox}>
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹{totalPrice.toFixed(2)}
                  </strong>
                </div>

                {/* ADD TO CART */}
                <button
                  style={{
                    ...styles.cartButton,
                    opacity: addingToCart
                      ? 0.7
                      : 1,
                    cursor: addingToCart
                      ? "not-allowed"
                      : "pointer",
                  }}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart
                    ? "Adding..."
                    : "🛒 Add to Cart"}
                </button>
              </>
            )}

            {/* OUT OF STOCK */}
            {stock <= 0 && (
              <button
                style={styles.disabledButton}
                disabled
              >
                Out of Stock
              </button>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "30px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "25px",
  },

  backButton: {
    border: "none",
    background: "#ffffff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  dashboardButton: {
    border: "none",
    background: "#e8f5e9",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  productSection: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "30px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "40px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },

  imageSection: {
    width: "100%",
  },

  imageBox: {
    width: "100%",
    height: "450px",
    background: "#f0f2f0",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  noImage: {
    fontSize: "100px",
  },

  detailsSection: {
    padding: "10px 0",
  },

  categoryBadge: {
    display: "inline-block",
    background: "#eef7ee",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    marginBottom: "12px",
  },

  title: {
    margin: "0 0 15px",
    fontSize: "32px",
    lineHeight: "1.2",
  },

  description: {
    color: "#555555",
    fontSize: "15px",
    lineHeight: "1.7",
    marginBottom: "25px",
  },

  infoBox: {
    background: "#f7f8f7",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "20px",
  },

  infoLabel: {
    fontSize: "13px",
    color: "#777777",
    marginBottom: "5px",
  },

  infoValue: {
    fontSize: "16px",
    fontWeight: "600",
  },

  priceBox: {
    display: "flex",
    alignItems: "baseline",
    gap: "7px",
    marginBottom: "8px",
  },

  price: {
    fontSize: "30px",
    fontWeight: "700",
  },

  unit: {
    fontSize: "14px",
    color: "#777777",
  },

  stock: {
    fontSize: "14px",
    marginBottom: "25px",
    fontWeight: "600",
  },

  quantitySection: {
    marginBottom: "20px",
  },

  quantityLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "10px",
  },

  quantityControls: {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    border: "1px solid #dddddd",
    borderRadius: "9px",
    overflow: "hidden",
  },

  quantityButton: {
    width: "42px",
    height: "42px",
    border: "none",
    background: "#f5f5f5",
    fontSize: "22px",
  },

  quantityValue: {
    width: "55px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
  },

  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f7f8f7",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "15px",
    fontSize: "16px",
  },

  cartButton: {
    width: "100%",
    border: "none",
    borderRadius: "9px",
    padding: "14px",
    background: "#222222",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
  },

  disabledButton: {
    width: "100%",
    border: "none",
    borderRadius: "9px",
    padding: "14px",
    background: "#cccccc",
    color: "#ffffff",
    cursor: "not-allowed",
    fontSize: "16px",
    fontWeight: "600",
  },

  primaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "13px 18px",
    background: "#222222",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  message: {
    maxWidth: "600px",
    margin: "80px auto",
    background: "#ffffff",
    padding: "50px",
    textAlign: "center",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
};