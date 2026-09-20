"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);
        const wishlistKey = `uzhavar_wishlist_${user.id}`;
        const savedWishlist = localStorage.getItem(wishlistKey);

        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist));
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Wishlist loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [router]);

  const removeFromWishlist = (id) => {
    if (!user) return;
    const wishlistKey = `uzhavar_wishlist_${user.id}`;
    const updatedWishlist = wishlist.filter((item) => String(item.id) !== String(id));
    setWishlist(updatedWishlist);
    localStorage.setItem(wishlistKey, JSON.stringify(updatedWishlist));
  };

  const handleAddToCart = (product) => {
    if (!user) return;
    const cartKey = `uzhavar_cart_${user.id}`;
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    } catch(e) {}
    
    const existingIndex = cart.findIndex((item) => String(item.id) === String(product.id));
    
    if (existingIndex !== -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image_url: product.image_url,
        farmer_id: product.farmer_id,
        farm_name: product.farmer_name || product.farm_name,
        category_name: product.category_name,
        quantity: 1
      });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
    removeFromWishlist(product.id);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f8f5] font-sans">
        <p className="text-lg text-gray-600 font-medium animate-pulse">Loading wishlist...</p>
      </main>
    );
  }

  if (wishlist.length === 0) {
    return (
      <main className="min-h-screen bg-[#f6f8f5] px-4 py-10 sm:p-10 font-sans">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/customer/products")}
            className="mb-8 text-gray-700 font-medium hover:text-green-800 transition-colors"
          >
            &larr; Continue Shopping
          </button>

          <div className="bg-white rounded-2xl p-10 sm:p-16 text-center shadow-sm border border-gray-100">
            <div className="text-7xl sm:text-8xl mb-6">❤️</div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
              Your Wishlist is Empty
            </h1>
            <p className="text-gray-500 mb-8 text-sm sm:text-base">
              Explore products and like them to add them to your wishlist.
            </p>
            <button
              onClick={() => router.push("/customer/products")}
              className="bg-green-800 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-colors shadow-sm"
            >
              Browse Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-8 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/customer/products")}
              className="text-gray-600 hover:text-green-800 font-medium text-sm sm:text-base mb-3 transition-colors"
            >
              &larr; Continue Shopping
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 m-0">
              My Wishlist
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} in your wishlist
            </p>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map((item, index) => {
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFromWishlist(item.id); }}
                    className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-red-500 hover:text-red-700 z-10 shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  </button>

                  <div 
                    className="aspect-square w-full bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/customer/products/${item.id}`)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🌱</div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h2 
                      className="text-lg font-bold text-gray-900 mb-1 truncate cursor-pointer hover:text-green-700"
                      onClick={() => router.push(`/customer/products/${item.id}`)}
                    >
                      {item.name}
                    </h2>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      🧑‍🌾 {item.farmer_name || 'Local Farmer'}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-green-800 font-bold">₹{Number(item.price || 0).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="mt-3 w-full bg-green-800 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      Move to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
