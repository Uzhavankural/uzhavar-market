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

  function getCustomerPrice() {
    if (!product) return 0;
    const farmerPrice = Number(product.price || 0);
    const commission = Number(product.commission_amount || 0);
    return farmerPrice + commission;
  }

  function increaseQuantity() {
    if (!product) return;
    const stock = Number(product.stock_quantity || 0);
    if (quantity < stock) {
      setQuantity((previous) => previous + 1);
    }
  }

  function decreaseQuantity() {
    if (quantity > 1) {
      setQuantity((previous) => previous - 1);
    }
  }

  async function handleAddToCart() {
    if (!product || addingToCart) return;

    const stock = Number(product.stock_quantity || 0);

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Please login to add products to cart.");
        router.push("/login");
        return;
      }

      const cartKey = `uzhavar_cart_${user.id}`;
      const savedCart = localStorage.getItem(cartKey);

      let cart = [];
      try {
        cart = savedCart ? JSON.parse(savedCart) : [];
        if (!Array.isArray(cart)) cart = [];
      } catch (error) {
        console.error("Cart parse error:", error);
        cart = [];
      }

      const existingIndex = cart.findIndex(
        (item) => String(item.id) === String(product.id)
      );

      if (existingIndex !== -1) {
        const existingQuantity = Number(cart[existingIndex].quantity || 0);
        const newQuantity = existingQuantity + quantity;

        if (newQuantity > stock) {
          alert(`Only ${stock} ${product.unit || "unit"} available in stock.`);
          return;
        }

        cart[existingIndex] = {
          ...cart[existingIndex],
          quantity: newQuantity,
          stock_quantity: stock,
          price: Number(product.price || 0),
          commission_amount: Number(product.commission_amount || 0),
          delivery_price: Number(product.delivery_price || 0),
          unit: product.unit || "unit",
          unit_count: Number(product.unit_count || 1),
          image_url: product.image_url || null,
          farmer_id: product.farmer_id,
          farm_name:
            product.profiles?.farm_name ||
            product.profiles?.full_name ||
            "Local Farmer",
          category_name: product.categories?.name || "General",
        };
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: Number(product.price || 0),
          commission_amount: Number(product.commission_amount || 0),
          delivery_price: Number(product.delivery_price || 0),
          unit: product.unit || "unit",
          unit_count: Number(product.unit_count || 1),
          image_url: product.image_url || null,
          stock_quantity: stock,
          farmer_id: product.farmer_id,
          farm_name:
            product.profiles?.farm_name ||
            product.profiles?.full_name ||
            "Local Farmer",
          category_name: product.categories?.name || "General",
          quantity: quantity,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(cart));
      alert(`${product.name} added to cart successfully!`);
      router.push("/customer/cart");
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Something went wrong while adding the product to cart.");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-12 text-center rounded-xl shadow-sm mt-20">
          <h2 className="text-xl font-bold">Loading product...</h2>
          <p className="text-gray-500 mt-2">Please wait.</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-12 text-center rounded-xl shadow-sm mt-20">
          <h2 className="text-xl font-bold mb-4">Product not found</h2>
          <p className="text-gray-500 mb-6">
            This product may have been removed or is no longer available.
          </p>
          <button
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer"
            onClick={() => router.push("/customer/products")}
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
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center gap-4 mb-6">
          <button
            className="bg-white px-4 py-2 rounded-lg font-medium shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50"
            onClick={() => router.push("/customer/products")}
          >
            ← Back to Products
          </button>
          <button
            className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-green-100"
            onClick={() => router.push("/customer")}
          >
            Dashboard
          </button>
        </div>

        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          <div className="w-full">
            <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-7xl">🌾</div>
              )}
            </div>
          </div>

          <div className="py-2">
            <div className="inline-block bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium mb-3">
              {product.categories?.name || "General"}
            </div>
            
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{product.name}</h1>
            
            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description || "Fresh farm product"}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">👨‍🌾 Farmer</div>
              <div className="font-semibold text-gray-900">{farmerName}</div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">₹{customerPrice.toFixed(2)}</span>
              <span className="text-gray-500">/ {product.unit_count || 1} {product.unit || "unit"}</span>
            </div>

            {Number(product.delivery_price) > 0 ? (
              <div className="text-sm text-gray-600 mb-6">
                + ₹{Number(product.delivery_price).toFixed(2)} delivery
              </div>
            ) : (
              <div className="text-sm text-green-600 font-medium mb-6">
                Free delivery
              </div>
            )}

            <div className={`text-sm font-medium mb-6 ${stock > 0 ? "text-green-700" : "text-red-600"}`}>
              {stock > 0 ? `✓ ${stock} available` : "Out of Stock"}
            </div>

            {stock > 0 ? (
              <>
                <div className="mb-5">
                  <div className="text-sm font-semibold text-gray-900 mb-2">Quantity</div>
                  <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      className={`w-10 h-10 flex items-center justify-center bg-gray-50 text-xl hover:bg-gray-100 ${
                        quantity <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                    <button
                      className={`w-10 h-10 flex items-center justify-center bg-gray-50 text-xl hover:bg-gray-100 ${
                        quantity >= stock ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                      onClick={increaseQuantity}
                      disabled={quantity >= stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                  <span className="font-medium text-gray-700">Total</span>
                  <strong className="text-lg text-gray-900">₹{totalPrice.toFixed(2)}</strong>
                </div>

                <button
                  className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${
                    addingToCart ? "bg-gray-700 cursor-not-allowed opacity-80" : "bg-gray-900 hover:bg-gray-800 cursor-pointer"
                  }`}
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? "Adding..." : "🛒 Add to Cart"}
                </button>
              </>
            ) : (
              <button
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gray-400 cursor-not-allowed"
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