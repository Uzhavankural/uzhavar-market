'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProductDetails() {
  const params = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadProduct()
    checkUser()
  }, [])

  async function loadProduct() {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'active')
      .single()

    if (productError || !productData) {
      console.log('PRODUCT ERROR:', productError)
      setLoading(false)
      return
    }

    const { data: farmerData } = await supabase
      .from('profiles')
      .select('full_name, farm_name, district, village, bio')
      .eq('id', productData.farmer_id)
      .single()

    const { data: categoryData } = await supabase
      .from('categories')
      .select('name, icon')
      .eq('id', productData.category_id)
      .single()

    setProduct(productData)
    setFarmer(farmerData)
    setCategory(categoryData)
    setLoading(false)
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user || null)
  }

  function handleAddToCart() {
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
      if (!Array.isArray(existingCart)) existingCart = [];
    } catch (error) {
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

  function handleBuyNow() {
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
      if (!Array.isArray(existingCart)) existingCart = [];
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

  if (loading) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <p className="text-lg text-gray-600 font-medium animate-pulse">Loading product...</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen flex justify-center items-center bg-[#f7f8f5] font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
          >
            &larr; Back to Home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] font-sans pb-12 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-[6%] py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="text-xl sm:text-2xl font-bold text-green-800 cursor-pointer" onClick={() => router.push('/')}>
          🌾 Uzhavar Market
        </div>

        <button
          onClick={() => router.push('/')}
          className="px-3 sm:px-5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm sm:text-base transition-colors"
        >
          &larr; Back
        </button>
      </nav>

      <section className="w-full sm:w-[90%] max-w-6xl mx-auto px-4 py-8 sm:py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="w-full min-h-[300px] sm:min-h-[450px] rounded-xl overflow-hidden bg-[#f0fdf4] flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-6xl sm:text-8xl">🌱</div>
            )}
          </div>

          <div className="py-2 flex flex-col">
            {category && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0fdf4] text-green-800 rounded-full text-sm font-semibold mb-4 self-start">
                <span>{category.icon}</span> {category.name}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 leading-tight">{product.name}</h1>

            <p className="text-base sm:text-lg leading-relaxed text-gray-500 mb-6">
              {product.description || 'No description available.'}
            </p>

            <div className="text-3xl sm:text-4xl font-bold text-green-800 flex items-end gap-2">
              ₹{(Number(product.price) + Number(product.commission_amount || 0)).toFixed(2)}
              <span className="text-lg font-normal text-gray-500 pb-1">/ {product.unit}</span>
            </div>

            <div className="mt-3 text-green-700 font-semibold flex items-center gap-2">
              🟢 {product.stock_quantity} {product.unit} available
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 sm:py-4 rounded-xl bg-green-100 text-green-800 text-lg font-bold hover:bg-green-200 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-300"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 sm:py-4 rounded-xl bg-green-800 text-white text-lg font-bold hover:bg-green-700 transition-colors focus:ring-4 focus:ring-green-100 active:bg-green-900 shadow-sm"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-10 p-5 sm:p-6 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 leading-relaxed">
            <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-100">
              <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">👨‍🌾 Farmer Details</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="text-gray-900">Farmer:</strong> {farmer?.farm_name || farmer?.full_name || 'Local Farmer'}
                </p>
                {farmer?.district && (
                  <p>
                    <strong className="text-gray-900">District:</strong> {farmer.district}
                  </p>
                )}
                {farmer?.bio && (
                  <p className="mt-2 pt-3 border-t border-gray-200">
                    <strong className="text-gray-900 block mb-1">About:</strong> {farmer.bio}
                  </p>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}