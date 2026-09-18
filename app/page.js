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
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoryError) {
        console.log("Category error:", categoryError.message);
      } else {
        setCategories(categoryData || []);
      }

      // Products
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(`
          *,
          profiles (
            full_name,
            farm_name,
            district
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productError) {
        console.log("Product error:", productError.message);
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
    (category) => category.name === selectedCategory
  )?.id;

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category_id === selectedCategoryId);

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
    if (!user) {
      alert("Please login to add products to cart.");
      router.push("/login");
      return;
    }

    const stock = Number(product.stock_quantity || 0);

    if (stock <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    const cartKey = `uzhavar_cart_${user.id}`;
    let existingCart = [];

    try {
      const storedCart = localStorage.getItem(cartKey);
      existingCart = storedCart ? JSON.parse(storedCart) : [];
      if (!Array.isArray(existingCart)) {
        existingCart = [];
      }
    } catch (error) {
      console.log("Cart read error:", error);
      existingCart = [];
    }

    const existingItem = existingCart.find((item) => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity || 0) + 1;
      if (newQuantity > stock) {
        alert(`Only ${stock} ${product.unit || "unit"} available in stock.`);
        return;
      }
      updatedCart = existingCart.map((item) =>
        item.id === product.id ? { ...item, quantity: newQuantity } : item
      );
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: Number(product.price || 0),
          commission_amount: Number(product.commission_amount || 0),
          unit: product.unit || "unit",
          image_url: product.image_url || "",
          stock_quantity: stock,
          farmer_id: product.farmer_id,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    alert("Product added to cart! 🛒");
  }

  function handleBuyNow(product) {
    if (!user) {
      alert("Please login to buy products.");
      router.push("/login");
      return;
    }

    const stock = Number(product.stock_quantity || 0);

    if (stock <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    const cartKey = `uzhavar_cart_${user.id}`;
    let existingCart = [];

    try {
      const storedCart = localStorage.getItem(cartKey);
      existingCart = storedCart ? JSON.parse(storedCart) : [];
      if (!Array.isArray(existingCart)) {
        existingCart = [];
      }
    } catch (error) {
      existingCart = [];
    }

    const existingItem = existingCart.find((item) => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity || 0) + 1;
      if (newQuantity <= stock) {
        updatedCart = existingCart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        updatedCart = existingCart;
      }
    } else {
      updatedCart = [
        ...existingCart,
        {
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: Number(product.price || 0),
          commission_amount: Number(product.commission_amount || 0),
          unit: product.unit || "unit",
          image_url: product.image_url || "",
          stock_quantity: stock,
          farmer_id: product.farmer_id,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    router.push("/customer/checkout");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-gray-800 font-sans flex flex-col">
      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="min-h-[70px] bg-white flex flex-col sm:flex-row items-center justify-between px-4 sm:px-[7%] py-4 sm:py-0 border-b border-gray-200 sticky top-0 z-50 shadow-sm gap-4 sm:gap-0">
        <div
          className="text-xl sm:text-2xl font-bold cursor-pointer whitespace-nowrap"
          onClick={() => router.push("/")}
        >
          🌾 Uzhavar Market
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <a href="/" className="hover:text-green-700 transition-colors">Home</a>
          <a href="#categories" className="hover:text-green-700 transition-colors">Categories</a>
          <a href="#products" className="hover:text-green-700 transition-colors">Products</a>

          {!authLoading && user && role === "customer" && (
            <>
              <button
                onClick={() => router.push("/customer/cart")}
                className="hover:text-green-700 transition-colors"
              >
                🛒 My Cart
              </button>
              <button
                onClick={() => router.push("/customer/orders")}
                className="hover:text-green-700 transition-colors"
              >
                📦 My Orders
              </button>
            </>
          )}

          {!authLoading && user && role === "farmer" && (
            <button
              onClick={() => router.push("/farmer")}
              className="hover:text-green-700 transition-colors"
            >
              🌾 Farmer Dashboard
            </button>
          )}

          {!authLoading && user && role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="hover:text-green-700 transition-colors"
            >
              ⚙️ Admin Dashboard
            </button>
          )}

          {!authLoading && !user && (
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg bg-green-800 text-white hover:bg-green-700 transition-colors"
            >
              Login
            </button>
          )}

          {!authLoading && user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-green-800 text-white hover:bg-green-700 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* =========================
          HERO
      ========================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-[7%] bg-[#e9f5e1] flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-bold tracking-[2px] mb-4 text-green-900">
            FARMERS DIRECTLY TO YOU
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-tight mb-5 font-bold text-gray-900">
            Fresh products.<br />Direct from farmers.
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-6 text-gray-700">
            Buy farm products directly from farmers and support local agriculture.
          </p>
          <button
            className="px-6 py-3 rounded-lg bg-green-800 text-white text-base font-medium hover:bg-green-700 transition-colors"
            onClick={() => {
              document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore Products
          </button>
        </div>
      </section>

      {/* =========================
          CATEGORIES
      ========================= */}
      <section id="categories" className="py-12 sm:py-16 px-4 sm:px-[7%]">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button
            className={`p-4 sm:p-6 bg-white border rounded-xl flex flex-col items-center justify-center transition-all ${
              selectedCategory === "All"
                ? "bg-green-100 border-2 border-green-800 font-bold"
                : "border-gray-200 hover:border-green-600 hover:shadow-sm"
            }`}
            onClick={() => setSelectedCategory("All")}
          >
            <div className="text-3xl mb-2">🛒</div>
            <span className="text-sm sm:text-base text-center">All Products</span>
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              className={`p-4 sm:p-6 bg-white border rounded-xl flex flex-col items-center justify-center transition-all ${
                selectedCategory === category.name
                  ? "bg-green-100 border-2 border-green-800 font-bold"
                  : "border-gray-200 hover:border-green-600 hover:shadow-sm"
              }`}
              onClick={() => {
                setSelectedCategory(category.name);
                setTimeout(() => {
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
            >
              <div className="text-3xl mb-2">{category.icon || "🌱"}</div>
              <span className="text-sm sm:text-base text-center">{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* =========================
          PRODUCTS
      ========================= */}
      <section id="products" className="py-12 sm:py-16 px-4 sm:px-[7%] flex-1">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-0">
            {selectedCategory === "All" ? "Featured Products" : selectedCategory}
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredProducts.length} products
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">No products available in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <div className="h-32 sm:h-48 bg-[#e8f1df] flex items-center justify-center text-4xl sm:text-6xl relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="group-hover:scale-110 transition-transform duration-300">🌾</span>
                  )}
                </div>

                <div className="p-3 sm:p-5 flex-1 flex flex-col">
                  <p className="text-[10px] sm:text-xs uppercase text-green-700 font-semibold mb-1">Farm Product</p>
                  <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
                  <p className="hidden sm:block text-sm text-gray-600 line-clamp-2 min-h-[40px] mb-2">
                    {product.description}
                  </p>

                  <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                    <div>
                      <strong className="text-gray-700">Farmer:</strong>{" "}
                      {product.profiles?.farm_name || product.profiles?.full_name || "Local Farmer"}
                    </div>
                    {product.profiles?.district && (
                      <div>
                        <strong className="text-gray-700">District:</strong>{" "}
                        {product.profiles.district}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-end gap-1 mb-1 sm:mb-2">
                      <strong className="text-base sm:text-2xl font-bold text-gray-900">
                        ₹
                        {(
                          Number(product.price || 0) + Number(product.commission_amount || 0)
                        ).toFixed(2)}
                      </strong>
                      <span className="text-[10px] sm:text-sm text-gray-500 pb-0.5">/ {product.unit}</span>
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-500 mb-2 sm:mb-4">
                      <span className={product.stock_quantity > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                        {product.stock_quantity > 0 ? `In Stock: ${product.stock_quantity}` : "Out of Stock"}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg bg-green-100 text-green-800 text-xs sm:text-sm font-bold hover:bg-green-200 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        Cart
                      </button>
                      <button
                        className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg bg-green-800 text-white text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-900 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(product);
                        }}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="py-10 px-4 sm:px-[7%] bg-[#17251a] text-white text-center mt-auto">
        <h3 className="text-xl font-bold mb-2">🌾 Uzhavar Market</h3>
        <p className="text-gray-400 text-sm">Connecting farmers directly with customers.</p>
      </footer>
    </main>
  );
}