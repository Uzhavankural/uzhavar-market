'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductView from '@/app/components/ProductView'

export default function ProductDetails() {
  const params = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [category, setCategory] = useState(null)
  const [reviews, setReviews] = useState([])
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
      
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', params.id)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })

    setProduct(productData)
    setFarmer(farmerData)
    setCategory(categoryData)
    setReviews(reviewsData || [])
    setLoading(false)
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user || null)
  }

  function handleAddToCart(quantityToAdd) {
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
      const newQuantity = Number(existingItem.quantity || 0) + quantityToAdd;
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
          quantity: quantityToAdd,
        },
      ];
    }
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    alert("Product added to cart! 🛒");
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
    <ProductView
      product={product}
      farmerName={farmer?.farm_name || farmer?.full_name || 'Local Farmer'}
      categoryName={category?.name || 'Product'}
      reviews={reviews}
      price={Number(product.price || 0) + Number(product.commission_amount || 0)}
      stock={Number(product.stock_quantity || 0)}
      onAddToCart={handleAddToCart}
      userId={user?.id}
    />
  )
}