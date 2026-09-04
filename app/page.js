"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Auth
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser || null);
      setAuthLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // GET USER ROLE
  // =========================
  useEffect(() => {
    let mounted = true;

    async function getRole() {
      if (!user) {
        setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      if (error) {
        console.log("Profile role error:", error.message);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
    }

    getRole();

    return () => {
      mounted = false;
    };
  }, [user]);

  // =========================
  // GET CATEGORIES + PRODUCTS
  // =========================
  useEffect(() => {
    async function getData() {
      // Categories
      const {
        data: categoryData,
        error: categoryError,
      } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoryError) {
        console.log(
          "Category error:",
          categoryError.message
        );
      } else {
        setCategories(categoryData || []);
      }

      // Products
      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

      if (productError) {
        console.log(
          "Product error:",
          productError.message
        );
      } else {
        setProducts(productData || []);
      }
    }

    getData();
  }, []);

  // =========================
  // CATEGORY FILTER
  // =========================
  const selectedCategoryId = categories.find(
    (category) =>
      category.name === selectedCategory
  )?.id;

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (product) =>
            product.category_id ===
            selectedCategoryId
        );

  // =========================
  // LOGOUT
  // =========================
  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setRole(null);

    router.push("/login");
    router.refresh();
  }

  // =========================
  // ADD TO CART
  // =========================
  function handleAddToCart(product) {
    // Login check
    if (!user) {
      alert("Please login to add products to cart.");
      router.push("/login");
      return;
    }

    const stock = Number(
      product.stock_quantity || 0
    );

    if (stock <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    // User-specific cart
    const cartKey = `uzhavar_cart_${user.id}`;

    let existingCart = [];

    try {
      const storedCart =
        localStorage.getItem(cartKey);

      existingCart = storedCart
        ? JSON.parse(storedCart)
        : [];

      if (!Array.isArray(existingCart)) {
        existingCart = [];
      }
    } catch (error) {
      console.log(
        "Cart read error:",
        error
      );

      existingCart = [];
    }

    const existingItem =
      existingCart.find(
        (item) => item.id === product.id
      );

    let updatedCart;

    if (existingItem) {
      const newQuantity =
        Number(existingItem.quantity || 0) + 1;

      if (newQuantity > stock) {
        alert(
          `Only ${stock} ${product.unit || "unit"} available in stock.`
        );
        return;
      }

      updatedCart = existingCart.map(
        (item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          description:
            product.description || "",
          price: Number(product.price || 0),
          commission_amount: Number(
            product.commission_amount || 0
          ),
          unit: product.unit || "unit",
          image_url:
            product.image_url || "",
          stock_quantity: stock,
          farmer_id:
            product.farmer_id,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(
      cartKey,
      JSON.stringify(updatedCart)
    );

    alert("Product added to cart! 🛒");
  }

  return (
    <main style={styles.page}>

      {/* =========================
          NAVBAR
      ========================= */}
      <nav
        className="navbar"
        style={styles.navbar}
      >
        <div
          style={styles.logo}
          onClick={() => router.push("/")}
        >
          🌾 Uzhavar Market
        </div>

        <div
          className="nav-links"
          style={styles.navLinks}
        >

          <a href="/">
            Home
          </a>

          <a href="#categories">
            Categories
          </a>

          <a href="#products">
            Products
          </a>

          {/* =========================
              CUSTOMER NAVIGATION
          ========================= */}
          {!authLoading &&
            user &&
            role === "customer" && (
              <>
                <button
                  onClick={() =>
                    router.push(
                      "/customer/cart"
                    )
                  }
                  style={styles.navButton}
                >
                  🛒 My Cart
                </button>

                <button
                  onClick={() =>
                    router.push(
                      "/customer/orders"
                    )
                  }
                  style={styles.navButton}
                >
                  📦 My Orders
                </button>
              </>
            )}

          {/* =========================
              FARMER NAVIGATION
          ========================= */}
          {!authLoading &&
            user &&
            role === "farmer" && (
              <button
                onClick={() =>
                  router.push("/farmer")
                }
                style={styles.navButton}
              >
                🌾 Farmer Dashboard
              </button>
            )}

          {/* =========================
              ADMIN NAVIGATION
          ========================= */}
          {!authLoading &&
            user &&
            role === "admin" && (
              <button
                onClick={() =>
                  router.push("/admin")
                }
                style={styles.navButton}
              >
                ⚙️ Admin Dashboard
              </button>
            )}

          {/* =========================
              LOGIN
          ========================= */}
          {!authLoading && !user && (
            <button
              onClick={() =>
                router.push("/login")
              }
              style={styles.loginButton}
            >
              Login
            </button>
          )}

          {/* =========================
              LOGOUT
          ========================= */}
          {!authLoading && user && (
            <button
              onClick={handleLogout}
              style={styles.loginButton}
            >
              Logout
            </button>
          )}

        </div>
      </nav>

      {/* =========================
          HERO
      ========================= */}
      <section
        className="hero"
        style={styles.hero}
      >
        <div>

          <p style={styles.smallTitle}>
            FARMERS DIRECTLY TO YOU
          </p>

          <h1 style={styles.heroTitle}>
            Fresh products.
            <br />
            Direct from farmers.
          </h1>

          <p style={styles.heroText}>
            Buy farm products directly from
            farmers and support local agriculture.
          </p>

          <button
            style={styles.shopButton}
            onClick={() => {
              document
                .getElementById("products")
                ?.scrollIntoView({
                  behavior: "smooth",
                });
            }}
          >
            Explore Products
          </button>

        </div>
      </section>

      {/* =========================
          CATEGORIES
      ========================= */}
      <section
        id="categories"
        className="section"
        style={styles.section}
      >

        <h2 style={styles.sectionTitle}>
          Shop by Category
        </h2>

        <div
          className="category-grid"
          style={styles.categoryGrid}
        >

          {/* All Products */}
          <button
            style={{
              ...styles.categoryCard,

              ...(selectedCategory === "All"
                ? styles.selectedCategory
                : {}),
            }}
            onClick={() => {
              setSelectedCategory("All");
            }}
          >

            <div style={styles.categoryIcon}>
              🛒
            </div>

            <span>
              All Products
            </span>

          </button>

          {/* Database Categories */}
          {categories.map(
            (category) => (
              <button
                key={category.id}
                style={{
                  ...styles.categoryCard,

                  ...(selectedCategory ===
                  category.name
                    ? styles.selectedCategory
                    : {}),
                }}
                onClick={() => {
                  setSelectedCategory(
                    category.name
                  );

                  setTimeout(() => {
                    document
                      .getElementById(
                        "products"
                      )
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }, 50);
                }}
              >

                <div
                  style={
                    styles.categoryIcon
                  }
                >
                  {category.icon ||
                    "🌱"}
                </div>

                <span>
                  {category.name}
                </span>

              </button>
            )
          )}

        </div>
      </section>

      {/* =========================
          PRODUCTS
      ========================= */}
      <section
        id="products"
        className="section"
        style={styles.section}
      >

        <div
          style={styles.productHeader}
        >

          <h2
            style={styles.sectionTitle}
          >
            {selectedCategory === "All"
              ? "Featured Products"
              : selectedCategory}
          </h2>

          <span
            style={styles.productCount}
          >
            {filteredProducts.length} products
          </span>

        </div>

        {filteredProducts.length ===
        0 ? (

          <p
            style={styles.noProducts}
          >
            No products available in this
            category.
          </p>

        ) : (

          <div
            className="product-grid"
            style={styles.productGrid}
          >

            {filteredProducts.map(
              (product) => (

                <div
                  key={product.id}
                  style={{
                    ...styles.productCard,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    router.push(
                      `/products/${product.id}`
                    )
                  }
                >

                  {/* Product Image */}
                  <div
                    style={
                      styles.productImage
                    }
                  >

                    {product.image_url ? (

                      <img
                        src={
                          product.image_url
                        }
                        alt={
                          product.name
                        }
                        style={
                          styles.productImageStyle
                        }
                      />

                    ) : (

                      <span>
                        🌾
                      </span>

                    )}

                  </div>

                  {/* Product Details */}
                  <div
                    style={
                      styles.productContent
                    }
                  >

                    <p
                      style={
                        styles.productCategory
                      }
                    >
                      Farm Product
                    </p>

                    <h3
                      style={
                        styles.productName
                      }
                    >
                      {product.name}
                    </h3>

                    <p
                      style={
                        styles.productDescription
                      }
                    >
                      {product.description}
                    </p>

                    <div
                      style={
                        styles.priceRow
                      }
                    >

                      <strong>
                        ₹
                        {(
                          Number(
                            product.price ||
                              0
                          ) +
                          Number(
                            product.commission_amount ||
                              0
                          )
                        ).toFixed(2)}
                      </strong>

                      <span>
                        /{" "}
                        {product.unit}
                      </span>

                    </div>

                    <p
                      style={
                        styles.stock
                      }
                    >
                      Stock:{" "}
                      {
                        product.stock_quantity
                      }
                    </p>

                    {/* Add to Cart */}
                    <button
                      style={
                        styles.cartButton
                      }
                      onClick={(e) => {
                        e.stopPropagation();

                        handleAddToCart(
                          product
                        );
                      }}
                    >
                      Add to Cart
                    </button>

                  </div>
                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer
        style={styles.footer}
      >

        <h3>
          🌾 Uzhavar Market
        </h3>

        <p>
          Connecting farmers directly
          with customers.
        </p>

      </footer>

    </main>
  );
}


/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f7f8f5",
    color: "#1f2937",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    minHeight: "70px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 7%",
    borderBottom:
      "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  logo: {
    fontSize: "22px",
    fontWeight: "700",
    cursor: "pointer",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },

  navButton: {
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    color: "#1f2937",
    cursor: "pointer",
    fontSize: "15px",
  },

  loginButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#166534",
    color: "#ffffff",
    cursor: "pointer",
  },

  hero: {
    padding: "90px 7%",
    background: "#e9f5e1",
  },

  smallTitle: {
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "2px",
    marginBottom: "15px",
  },

  heroTitle: {
    fontSize: "52px",
    lineHeight: "1.1",
    margin: "0 0 20px",
    maxWidth: "650px",
  },

  heroText: {
    fontSize: "18px",
    lineHeight: "1.6",
    maxWidth: "550px",
  },

  shopButton: {
    marginTop: "20px",
    padding: "14px 25px",
    border: "none",
    borderRadius: "8px",
    background: "#166534",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
  },

  section: {
    padding: "60px 7%",
  },

  sectionTitle: {
    fontSize: "30px",
    marginBottom: "30px",
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
  },

  categoryCard: {
    padding: "25px 15px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s",
  },

  selectedCategory: {
    background: "#dcfce7",
    border:
      "2px solid #166534",
    fontWeight: "700",
  },

  categoryIcon: {
    fontSize: "30px",
    marginBottom: "10px",
  },

  productHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productCount: {
    fontSize: "14px",
    color: "#6b7280",
  },

  productGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "25px",
  },

  productCard: {
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
    border:
      "1px solid #e5e7eb",
  },

  productImage: {
    height: "180px",
    background: "#e8f1df",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "60px",
  },

  productImageStyle: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  productContent: {
    padding: "20px",
  },

  productCategory: {
    fontSize: "12px",
    margin: "0 0 8px",
    textTransform: "uppercase",
  },

  productName: {
    fontSize: "20px",
    margin: "0 0 8px",
  },

  productDescription: {
    fontSize: "14px",
    lineHeight: "1.5",
    minHeight: "42px",
  },

  priceRow: {
    marginTop: "15px",
    fontSize: "18px",
    display: "flex",
    gap: "5px",
    alignItems: "baseline",
  },

  stock: {
    fontSize: "13px",
  },

  cartButton: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#166534",
    color: "#ffffff",
    cursor: "pointer",
  },

  noProducts: {
    fontSize: "16px",
    color: "#6b7280",
  },

  footer: {
    padding: "40px 7%",
    background: "#17251a",
    color: "#ffffff",
    textAlign: "center",
  },
};