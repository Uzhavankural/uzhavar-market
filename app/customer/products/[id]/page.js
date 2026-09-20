"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductView from "@/app/components/ProductView";

export default function CustomerProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

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
          farm_name,
          district,
          village
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
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("product_id", params.id)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      setReviews(reviewsData || []);
    }

    setLoading(false);
  }

  function getCustomerPrice() {
    if (!product) return 0;
    const farmerPrice = Number(product.price || 0);
    const commission = Number(product.commission_amount || 0);
    return farmerPrice + commission;
  }

  async function handleAddToCart(quantityToAdd) {
    if (!product || addingToCart) return;

    const stock = Number(product.stock_quantity || 0);

    if (stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (quantityToAdd > stock) {
      alert("Selected quantity is not available.");
      return;
    }

    setAddingToCart(true);

    try {
      if (!user) {
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
        const newQuantity = existingQuantity + quantityToAdd;

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
          quantity: quantityToAdd,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(cart));
      alert(`${product.name} added to cart successfully!`);
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
  const baseFarmerName =
    product.profiles?.farm_name ||
    product.profiles?.full_name ||
    "Local Farmer";
  const place = product.profiles?.district;
  const farmerNameWithPlace = place ? `${baseFarmerName} - ${place}` : baseFarmerName;

  return (
    <ProductView
      product={product}
      farmerName={farmerNameWithPlace}
      categoryName={product.categories?.name || "Product"}
      reviews={reviews}
      price={customerPrice}
      stock={Number(product.stock_quantity || 0)}
      onAddToCart={handleAddToCart}
      userId={user?.id}
    />
  );
}