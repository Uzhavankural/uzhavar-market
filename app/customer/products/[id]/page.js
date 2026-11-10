"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductView from "@/app/components/ProductView";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CustomerProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, tu } = useLanguage();

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
      alert(t("home.outOfStockAlert"));
      return;
    }

    if (quantityToAdd > stock) {
      alert(t("home.stockLimitAlert", { stock, unit: tu(product.unit || "unit") }));
      return;
    }

    setAddingToCart(true);

    try {
      if (!user) {
        alert(t("home.loginToCart"));
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
          alert(t("home.stockLimitAlert", { stock, unit: tu(product.unit || "unit") }));
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
      alert(`${t("home.addedToCartAlert")} 🛒`);
    } catch (error) {
      console.error("Add to cart error:", error);
      alert(t("common.somethingWentWrong"));
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-12 text-center rounded-xl shadow-sm mt-20">
          <h2 className="text-xl font-bold">{t("productView.loadingProduct")}</h2>
          <p className="text-gray-500 mt-2">{t("common.pleaseWait")}</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-12 text-center rounded-xl shadow-sm mt-20">
          <h2 className="text-xl font-bold mb-4">{t("productView.productNotFound")}</h2>
          <p className="text-gray-500 mb-6">
            {t("productView.productRemovedNotice")}
          </p>
          <button
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer"
            onClick={() => router.push("/customer/products")}
          >
            &larr; {t("nav.backToProducts")}
          </button>
        </div>
      </main>
    );
  }

  const customerPrice = getCustomerPrice();
  const baseFarmerName =
    product.profiles?.farm_name ||
    product.profiles?.full_name ||
    t("common.localFarmer");
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
