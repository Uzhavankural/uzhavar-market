"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function loadProducts() {
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
      .eq("approval_status", "active")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products loading error:", error);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories loading error:", error);
      return;
    }

    setCategories(data || []);
  }

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    const productName = product.name?.toLowerCase() || "";
    const description = product.description?.toLowerCase() || "";
    const farmName = product.profiles?.farm_name?.toLowerCase() || "";
    const farmerName = product.profiles?.full_name?.toLowerCase() || "";

    const matchesSearch =
      productName.includes(searchText) ||
      description.includes(searchText) ||
      farmName.includes(searchText) ||
      farmerName.includes(searchText);

    const matchesCategory =
      selectedCategory === "all" ||
      String(product.category_id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  function getCustomerPrice(product) {
    const farmerPrice = Number(product.price || 0);
    const commission = Number(product.commission_amount || 0);

    return farmerPrice + commission;
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shadow-sm">
          <div>
            <h1 className="m-0 text-2xl sm:text-3xl font-bold text-gray-900">
              🌾 Uzhavar Market
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Fresh products directly from farmers
            </p>
          </div>
          <button
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors"
            onClick={() => router.push("/customer")}
          >
            &larr; Dashboard
          </button>
        </header>

        {/* Shop Header */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="m-0 text-xl sm:text-2xl font-bold text-gray-900">
              🛒 Products
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Choose fresh products from our farmers
            </p>
          </div>
          <button
            className="w-full sm:w-auto px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg font-semibold transition-colors"
            onClick={loadProducts}
          >
            🔄 Refresh
          </button>
        </section>

        {/* Search and Category */}
        <section className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="🔍 Search products or farmers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-w-[220px] bg-white border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {/* Loading */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl mt-10">
            <h3 className="text-xl font-bold text-gray-800">Loading products...</h3>
            <p className="text-gray-500 mt-2">Please wait.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* No Products */
          <div className="bg-white p-12 text-center rounded-2xl mt-10">
            <h3 className="text-xl font-bold text-gray-800">No products found</h3>
            <p className="text-gray-500 mt-2">Try another search or category.</p>
          </div>
        ) : (
          /* Products Grid */
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
            {filteredProducts.map((product) => {
              const customerPrice = getCustomerPrice(product);
              const stock = Number(product.stock_quantity || 0);
              const farmerName =
                product.profiles?.farm_name ||
                product.profiles?.full_name ||
                "Local Farmer";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/customer/products/${product.id}`)}
                >
                  {/* Product Image */}
                  <div className="h-32 sm:h-48 bg-[#f0f2f0] flex items-center justify-center text-4xl sm:text-6xl relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="group-hover:scale-110 transition-transform duration-300">🌾</div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="p-3 sm:p-5 flex-1 flex flex-col">
                    <div className="inline-block self-start bg-green-50 text-green-800 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold mb-2">
                      {product.categories?.name || "General"}
                    </div>

                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="hidden sm:block text-xs sm:text-sm text-gray-600 line-clamp-2 min-h-[40px] mb-2">
                      {product.description || "Fresh farm product"}
                    </p>

                    <div className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
                      👨‍🌾 {farmerName}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-end gap-1 mb-1 sm:mb-2">
                        <strong className="text-base sm:text-xl font-bold text-gray-900">
                          ₹{customerPrice.toFixed(2)}
                        </strong>
                        <span className="text-[10px] sm:text-xs text-gray-500 pb-0.5">
                          / {product.unit_count || 1} {product.unit || "unit"}
                        </span>
                      </div>
                      
                      {Number(product.delivery_price) > 0 ? (
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-2">
                          + ₹{Number(product.delivery_price).toFixed(2)} delivery
                        </div>
                      ) : (
                        <div className="text-[10px] sm:text-xs text-green-600 font-medium mb-1 sm:mb-2">
                          Free delivery
                        </div>
                      )}

                      {stock > 0 ? (
                        <div className="text-[10px] sm:text-xs font-medium text-green-700 mb-2 sm:mb-3">
                          ✓ {stock} available
                        </div>
                      ) : (
                        <div className="text-[10px] sm:text-xs font-medium text-red-600 mb-2 sm:mb-3">
                          Out of Stock
                        </div>
                      )}

                      <button
                        disabled={stock <= 0}
                        className={`w-full py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-md sm:rounded-lg text-white text-xs sm:text-sm font-semibold transition-colors focus:ring-4 focus:ring-green-100 ${
                          stock > 0
                            ? "bg-gray-800 hover:bg-gray-900 active:bg-gray-950"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (stock > 0) {
                            router.push(`/customer/products/${product.id}`);
                          }
                        }}
                      >
                        {stock > 0 ? "View Product" : "Out of Stock"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}