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

  const pageStyle = {
    minHeight: "100vh",
    background: "#f5f7f5",
    padding: "30px",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle = {
    background: "#ffffff",
    padding: "22px 25px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "8px",
    padding: "11px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  };

  const backButtonStyle = {
    ...buttonStyle,
    background: "#eeeeee",
  };

  const refreshButtonStyle = {
    ...buttonStyle,
    background: "#e8f5e9",
  };

  const shopHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  };

  const filterStyle = {
    display: "flex",
    gap: "15px",
    marginBottom: "25px",
  };

  const searchStyle = {
    flex: "1",
    background: "#ffffff",
    border: "1px solid #dddddd",
    borderRadius: "10px",
    padding: "13px 15px",
    fontSize: "15px",
    outline: "none",
    minWidth: "0",
  };

  const selectStyle = {
    minWidth: "220px",
    background: "#ffffff",
    border: "1px solid #dddddd",
    borderRadius: "10px",
    padding: "13px 15px",
    fontSize: "15px",
    outline: "none",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "20px",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  };

  const imageBoxStyle = {
    width: "100%",
    height: "190px",
    background: "#f0f2f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const contentStyle = {
    padding: "17px",
  };

  const categoryStyle = {
    display: "inline-block",
    background: "#eef7ee",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    marginBottom: "8px",
  };

  const descriptionStyle = {
    color: "#666666",
    fontSize: "13px",
    minHeight: "38px",
    margin: "8px 0",
    lineHeight: "1.5",
  };

  const farmerStyle = {
    fontSize: "13px",
    color: "#555555",
    margin: "10px 0",
  };

  const priceRowStyle = {
    display: "flex",
    alignItems: "baseline",
    gap: "5px",
    margin: "12px 0",
  };

  const priceStyle = {
    fontSize: "21px",
    fontWeight: "700",
  };

  const unitStyle = {
    color: "#777777",
    fontSize: "13px",
  };

  const stockStyle = {
    fontSize: "13px",
    marginBottom: "12px",
  };

  const viewButtonStyle = {
    width: "100%",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "600",
    background: "#222222",
    color: "#ffffff",
    fontSize: "14px",
  };

  const disabledButtonStyle = {
    ...viewButtonStyle,
    background: "#cccccc",
    cursor: "not-allowed",
  };

  const messageStyle = {
    background: "#ffffff",
    padding: "50px",
    textAlign: "center",
    borderRadius: "14px",
    marginTop: "40px",
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1
              style={{
                margin: "0",
                fontSize: "26px",
              }}
            >
              🌾 Uzhavar Market
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#666666",
              }}
            >
              Fresh products directly from farmers
            </p>
          </div>

          <button
            style={backButtonStyle}
            onClick={() => router.push("/customer")}
          >
            ← Dashboard
          </button>
        </header>

        {/* Shop Header */}
        <section style={shopHeaderStyle}>
          <div>
            <h2
              style={{
                margin: "0",
                fontSize: "24px",
              }}
            >
              🛒 Products
            </h2>

            <p
              style={{
                margin: "5px 0 0",
                color: "#666666",
              }}
            >
              Choose fresh products from our farmers
            </p>
          </div>

          <button
            style={refreshButtonStyle}
            onClick={loadProducts}
          >
            🔄 Refresh
          </button>
        </section>

        {/* Search and Category */}
        <section style={filterStyle}>
          <input
            type="text"
            placeholder="🔍 Search products or farmers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchStyle}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </section>

        {/* Loading */}
        {loading ? (
          <div style={messageStyle}>
            <h3>Loading products...</h3>
            <p>Please wait.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* No Products */
          <div style={messageStyle}>
            <h3>No products found</h3>
            <p>
              Try another search or category.
            </p>
          </div>
        ) : (
          /* Products */
          <section style={gridStyle}>
            {filteredProducts.map((product) => {
              const customerPrice =
                getCustomerPrice(product);

              const stock = Number(
                product.stock_quantity || 0
              );

              const farmerName =
                product.profiles?.farm_name ||
                product.profiles?.full_name ||
                "Local Farmer";

              return (
                <div
                  key={product.id}
                  style={cardStyle}
                >
                  {/* Product Image */}
                  <div style={imageBoxStyle}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={imageStyle}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: "55px",
                        }}
                      >
                        🌾
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div style={contentStyle}>
                    <div style={categoryStyle}>
                      {product.categories?.name ||
                        "General"}
                    </div>

                    <h3
                      style={{
                        margin: "5px 0",
                        fontSize: "18px",
                      }}
                    >
                      {product.name}
                    </h3>

                    <p style={descriptionStyle}>
                      {product.description ||
                        "Fresh farm product"}
                    </p>

                    <div style={farmerStyle}>
                      👨‍🌾 {farmerName}
                    </div>

                    <div style={priceRowStyle}>
                      <strong style={priceStyle}>
                        ₹{customerPrice.toFixed(2)}
                      </strong>

                      <span style={unitStyle}>
                        / {product.unit || "unit"}
                      </span>
                    </div>

                    {stock > 0 ? (
                      <div
                        style={{
                          ...stockStyle,
                          color: "#26733a",
                        }}
                      >
                        ✓ {stock} available
                      </div>
                    ) : (
                      <div
                        style={{
                          ...stockStyle,
                          color: "#b42318",
                        }}
                      >
                        Out of Stock
                      </div>
                    )}

                    <button
                      disabled={stock <= 0}
                      style={
                        stock > 0
                          ? viewButtonStyle
                          : disabledButtonStyle
                      }
                      onClick={() =>
                        router.push(
                          `/customer/products/${product.id}`
                        )
                      }
                    >
                      {stock > 0
                        ? "View Product"
                        : "Out of Stock"}
                    </button>
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