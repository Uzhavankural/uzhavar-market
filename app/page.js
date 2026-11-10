"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { ensureFarmerAccess } from "../lib/farmerAuth";
import HeroBanner from "./components/HeroBanner";
import Footer from "./components/Footer";
import LanguageToggle from "./components/LanguageToggle";
import { useLanguage } from "./context/LanguageContext";

function readCartFromStorage(cartKey) {
  try {
    const storedCart = localStorage.getItem(cartKey);
    const parsed = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log("Cart read error:", error);
    return [];
  }
}

function buildCartItem(product, stock) {
  return {
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
  };
}

export default function Home() {
  const router = useRouter();
  const { t, tc, tu } = useLanguage();

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
      if (typeof window !== "undefined") {
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        if (
          hash.includes("type=recovery") ||
          search.includes("type=recovery")
        ) {
          router.replace("/reset-password" + search + hash);
          return;
        }

        if (
          hash.includes("access_token") ||
          search.includes("code=") ||
          search.includes("type=signup") ||
          hash.includes("type=signup") ||
          search.includes("token_hash=") ||
          hash.includes("token_hash=") ||
          search.includes("token=")
        ) {
          router.replace("/auth/callback" + search + hash);
          return;
        }
      }

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
  }, [router]);

  // =========================
  // GET USER ROLE & JANARANJANA DIRECT ACCESS
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
        .select("*")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const effective = await ensureFarmerAccess(data, user);

      if (error && !effective.role) {
        console.log("Profile role error:", error.message);
        setRole(null);
      } else {
        setRole(effective.role || null);
      }
    }

    getRole();

    return () => {
      mounted = false;
    };
  }, [user, router]);

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
  // ADD TO CART & BUY NOW
  // =========================
  function addProductToUserCart(product, { buyNow = false } = {}) {
    if (!user) {
      alert(t(buyNow ? "home.loginToBuy" : "home.loginToCart"));
      router.push("/login");
      return;
    }

    const stock = Number(product.stock_quantity || 0);
    if (stock <= 0) {
      alert(t("home.outOfStockAlert"));
      return;
    }

    const cartKey = `uzhavar_cart_${user.id}`;
    const existingCart = readCartFromStorage(cartKey);
    const existingItem = existingCart.find((item) => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity || 0) + 1;
      if (newQuantity > stock) {
        if (!buyNow) {
          alert(t("home.stockLimitAlert", { stock, unit: tu(product.unit || "unit") }));
          return;
        }
        updatedCart = existingCart;
      } else {
        updatedCart = existingCart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      }
    } else {
      updatedCart = [...existingCart, buildCartItem(product, stock)];
    }

    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    if (buyNow) {
      router.push("/customer/checkout");
    } else {
      alert(`${t("home.addedToCartAlert")} 🛒`);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-gray-800 font-sans flex flex-col pb-20 sm:pb-0">
      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="min-h-[58px] sm:min-h-[70px] bg-white flex items-center justify-between px-3 sm:px-[7%] py-2 sm:py-0 border-b border-gray-200 sticky top-0 z-50 shadow-xs gap-2">
        <div
          className="text-[15px] sm:text-2xl font-bold cursor-pointer whitespace-nowrap text-green-950 flex items-center gap-1.5 shrink-0"
          onClick={() => router.push("/")}
        >
          <span>🌾</span>
          <span>{t("brand")}</span>
        </div>

        {/* MOBILE TOP CONTROLS (sm:hidden) */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <LanguageToggle variant="compact" />

          {!authLoading && user && role === "farmer" && (
            <button
              onClick={() => router.push("/farmer")}
              className="px-2 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap active:scale-95 flex items-center gap-1 shadow-2xs"
            >
              <span>🌾</span>
              <span>{t("nav.dashboard")}</span>
            </button>
          )}

          {!authLoading && user && role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-2 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors whitespace-nowrap active:scale-95 flex items-center gap-1 shadow-2xs"
            >
              <span>⚙️</span>
              <span>{t("nav.admin")}</span>
            </button>
          )}

          {!authLoading && user && (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors whitespace-nowrap active:scale-95 shadow-xs"
            >
              {t("nav.logout")}
            </button>
          )}

          {!authLoading && !user && (
            <button
              onClick={() => router.push("/login")}
              className="px-2.5 py-1.5 rounded-lg bg-green-800 text-white text-xs font-bold hover:bg-green-700 transition-colors whitespace-nowrap active:scale-95 shadow-xs"
            >
              {t("nav.login")}
            </button>
          )}
        </div>

        {/* DESKTOP NAVIGATION (hidden sm:flex) */}
        <div className="hidden sm:flex items-center gap-4 lg:gap-5 flex-wrap justify-end">
          <Link href="/" className="hover:text-green-700 transition-colors font-medium whitespace-nowrap">{t("nav.home")}</Link>
          <a href="#categories" className="hover:text-green-700 transition-colors font-medium whitespace-nowrap">{t("nav.categories")}</a>
          <a href="#products" className="hover:text-green-700 transition-colors font-medium whitespace-nowrap">{t("nav.products")}</a>
          <Link href="/about" className="hover:text-green-700 transition-colors font-medium whitespace-nowrap">{t("nav.aboutUs")}</Link>
          <Link href="/contact" className="hover:text-green-700 transition-colors font-medium whitespace-nowrap">{t("nav.contact")}</Link>

          <LanguageToggle />

          {!authLoading && user && (role === "customer" || role === "farmer") && (
            <>
              <button
                onClick={() => router.push("/customer/cart")}
                className="hover:text-green-700 transition-colors font-medium whitespace-nowrap"
              >
                🛒 {t("nav.myCart")}
              </button>
              <button
                onClick={() => router.push("/customer/orders")}
                className="hover:text-green-700 transition-colors font-medium whitespace-nowrap"
              >
                📦 {t("nav.myOrders")}
              </button>
            </>
          )}

          {!authLoading && user && role === "farmer" && (
            <button
              onClick={() => router.push("/farmer")}
              className="hover:text-green-700 transition-colors font-medium whitespace-nowrap"
            >
              🌾 {t("nav.farmerDashboard")}
            </button>
          )}

          {!authLoading && user && role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="hover:text-green-700 transition-colors font-medium whitespace-nowrap"
            >
              ⚙️ {t("nav.adminDashboard")}
            </button>
          )}

          {!authLoading && !user && (
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-lg bg-green-800 text-white hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              {t("nav.login")}
            </button>
          )}

          {!authLoading && user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-green-800 text-white hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
            >
              {t("nav.logout")}
            </button>
          )}
        </div>
      </nav>

      {/* =========================
          ANIMATED HERO BANNER
      ========================= */}
      <HeroBanner targetScrollId="products" />

      {/* =========================
          CATEGORIES
      ========================= */}
      <section id="categories" className="py-12 sm:py-16 px-4 sm:px-[7%]">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left">{t("home.shopByCategory")}</h2>
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
            <span className="text-sm sm:text-base text-center">{t("home.allProducts")}</span>
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
              <span className="text-sm sm:text-base text-center">{tc(category.name)}</span>
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
            {selectedCategory === "All" ? t("home.featuredProducts") : tc(selectedCategory)}
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {t("home.productsCount", { count: filteredProducts.length })}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">{t("home.noProductsInCategory")}</p>
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
                  <p className="text-[10px] sm:text-xs uppercase text-green-700 font-semibold mb-1">{t("home.farmProduct")}</p>
                  <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{product.name}</h3>
                  <p className="hidden sm:block text-sm text-gray-600 line-clamp-2 min-h-[40px] mb-2">
                    {product.description}
                  </p>

                  <div className="flex flex-col gap-0.5 text-[10px] sm:text-xs text-gray-600 dark:text-slate-300 mb-2 sm:mb-3">
                    <div>
                      <strong className="text-gray-700 dark:text-slate-400">{t("common.farmer")}:</strong>{" "}
                      <span className="text-gray-900 dark:text-slate-100 font-medium">
                        {product.profiles?.farm_name || product.profiles?.full_name || t("common.localFarmer")}
                      </span>
                    </div>
                    {product.profiles?.district && (
                      <div>
                        <strong className="text-gray-700 dark:text-slate-400">{t("common.district")}:</strong>{" "}
                        <span className="text-gray-900 dark:text-slate-100 font-medium">
                          {product.profiles.district}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-end gap-1 mb-1 sm:mb-2">
                      <strong className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white">
                        ₹
                        {(
                          Number(product.price || 0) + Number(product.commission_amount || 0)
                        ).toFixed(2)}
                      </strong>
                      <span className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 pb-0.5">/ {tu(product.unit)}</span>
                    </div>
                    <p className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400 mb-2 sm:mb-4">
                      <span className={product.stock_quantity > 0 ? "text-green-600 dark:text-emerald-400 font-semibold" : "text-red-500 dark:text-rose-400 font-semibold"}>
                        {product.stock_quantity > 0
                          ? t("home.inStockCount", { count: product.stock_quantity })
                          : t("common.outOfStock")}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg bg-green-100 dark:bg-slate-800 text-green-800 dark:text-emerald-400 border border-transparent dark:border-slate-700 text-xs sm:text-sm font-bold hover:bg-green-200 dark:hover:bg-slate-700 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          addProductToUserCart(product, { buyNow: false });
                        }}
                      >
                        {t("home.cartBtn")}
                      </button>
                      <button
                        className="flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg bg-green-800 dark:bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-green-700 dark:hover:bg-emerald-500 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-900 shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addProductToUserCart(product, { buyNow: true });
                        }}
                      >
                        {t("home.buyBtn")}
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
      <Footer />

      {/* =========================
          MOBILE BOTTOM NAVIGATION BAR (sm:hidden)
      ========================= */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-gray-600 dark:text-slate-300 hover:text-green-800 dark:hover:text-emerald-400 active:scale-90 transition-transform"
        >
          <span className="text-xl leading-none">🏠</span>
          <span className="text-[10px] font-semibold tracking-tight mt-1 text-gray-700 dark:text-slate-200">{t("bottomNav.home")}</span>
        </button>

        <button
          onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-gray-600 dark:text-slate-300 hover:text-green-800 dark:hover:text-emerald-400 active:scale-90 transition-transform"
        >
          <span className="text-xl leading-none">📂</span>
          <span className="text-[10px] font-semibold tracking-tight mt-1 text-gray-700 dark:text-slate-200">{t("bottomNav.categories")}</span>
        </button>

        <button
          onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-gray-600 dark:text-slate-300 hover:text-green-800 dark:hover:text-emerald-400 active:scale-90 transition-transform"
        >
          <span className="text-xl leading-none">🌾</span>
          <span className="text-[10px] font-semibold tracking-tight mt-1 text-gray-700 dark:text-slate-200">{t("bottomNav.products")}</span>
        </button>

        <button
          onClick={() => router.push("/customer/cart")}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-gray-600 dark:text-slate-300 hover:text-green-800 dark:hover:text-emerald-400 active:scale-90 transition-transform"
        >
          <span className="text-xl leading-none">🛒</span>
          <span className="text-[10px] font-semibold tracking-tight mt-1 text-gray-700 dark:text-slate-200">{t("bottomNav.myCart")}</span>
        </button>

        <button
          onClick={() => router.push(user ? "/customer/orders" : "/login")}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-gray-600 dark:text-slate-300 hover:text-green-800 dark:hover:text-emerald-400 active:scale-90 transition-transform"
        >
          <span className="text-xl leading-none">📦</span>
          <span className="text-[10px] font-semibold tracking-tight mt-1 text-gray-700 dark:text-slate-200">{t("bottomNav.myOrders")}</span>
        </button>
      </nav>
    </main>
  );
}
