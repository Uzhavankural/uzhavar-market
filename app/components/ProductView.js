"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Cart: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
  User: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Heart: ({ className, filled }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>,
  Leaf: ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  Shield: ({ className }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Plant: ({ className }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  Truck: ({ className }) => <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="15" height="13" x="1" y="8" rx="2" ry="2"/><path d="M16 8h2.55a2 2 0 0 1 1.95 1.57l1.5 6A2 2 0 0 1 20 18h-4"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>,
  Star: ({ filled, half, className }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#fbbf24" : (half ? "url(#half)" : "none")} stroke={filled || half ? "#fbbf24" : "#d1d5db"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {half && (
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

export default function ProductView({
  product,
  farmerName,
  categoryName,
  reviews = [],
  price,
  stock,
  onAddToCart,
  userId
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imagesList = product?.images?.length > 0 ? product.images : (product?.image_url ? [product.image_url] : []);

  useEffect(() => {
    if (userId) {
      const cartKey = `uzhavar_cart_${userId}`;
      try {
        const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
        let count = 0;
        cart.forEach(item => count += (item.quantity || 1));
        setCartCount(count);
      } catch (e) {}

      const wishlistKey = `uzhavar_wishlist_${userId}`;
      try {
        const wishlist = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
        if (wishlist.some(item => String(item.id) === String(product?.id))) {
          setIsLiked(true);
        }
      } catch (e) {}
    }
  }, [userId, product?.id]);

  const decreaseQty = () => { if (quantity > 1) setQuantity(q => q - 1); };
  const increaseQty = () => { if (quantity < stock) setQuantity(q => q + 1); };

  const handleAdd = () => {
    onAddToCart(quantity);
    // Update count immediately for better UX
    setCartCount(prev => prev + quantity);
  };

  const handleBuyNow = () => {
    onAddToCart(quantity);
    router.push(userId ? '/customer/cart' : '/login');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name} on Uzhavar Market!`,
          url: url,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const toggleWishlist = () => {
    if (!userId) {
      alert("Please login to add to wishlist");
      router.push("/login");
      return;
    }
    const wishlistKey = `uzhavar_wishlist_${userId}`;
    try {
      let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || "[]");
      if (isLiked) {
        wishlist = wishlist.filter(item => String(item.id) !== String(product.id));
        setIsLiked(false);
      } else {
        wishlist.push({
          id: product.id,
          name: product.name,
          image_url: product.image_url,
          price,
          unit: product.unit,
          farmer_name: farmerName,
          category_name: categoryName
        });
        setIsLiked(true);
      }
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    } catch (e) {}
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length 
    : 0;

  const starCounts = {5:0, 4:0, 3:0, 2:0, 1:0};
  reviews.forEach(r => {
    if (r.rating && starCounts[r.rating] !== undefined) {
      starCounts[r.rating]++;
    }
  });

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="max-w-[480px] mx-auto bg-white min-h-screen sm:shadow-lg sm:border-x sm:border-gray-200 relative pb-24">
        
        {/* Header */}
        <header className="flex items-center justify-between p-3 bg-[#115e59] text-white sticky top-0 z-20">
          <button onClick={() => router.back()} className="p-1 hover:bg-white/10 rounded-full cursor-pointer">
            <Icons.Back />
          </button>
          
          <div className="flex-1 px-3 flex items-center gap-2">
             <div className="text-xl">🌾</div>
             <div className="font-bold whitespace-nowrap hidden sm:block">Uzhavar Market</div>
          </div>
          
          <div className="flex-1 max-w-[200px]">
            <div className="relative">
              <input type="text" placeholder="Search products..." className="w-full pl-8 pr-3 py-1.5 rounded bg-white text-gray-800 text-sm outline-none" />
              <div className="absolute left-2 top-1.5 text-gray-500"><Icons.Search /></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
            <button className="relative p-1 hover:bg-white/10 rounded-full cursor-pointer" onClick={() => router.push(userId ? '/customer/wishlist' : '/login')}>
              <Icons.Heart />
            </button>
            <button className="relative p-1 hover:bg-white/10 rounded-full cursor-pointer" onClick={() => router.push(userId ? '/customer/cart' : '/login')}>
              <Icons.Cart />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="p-1 hover:bg-white/10 rounded-full cursor-pointer" onClick={() => router.push(userId ? '/customer' : '/login')}>
              <Icons.User />
            </button>
          </div>
        </header>

        <div className="p-4">
          {/* Image Carousel */}
          <div className="relative rounded-xl overflow-hidden bg-[#f0fdf4] aspect-[4/3] mb-4 flex items-center justify-center group">
            {imagesList.length > 0 ? (
              <>
                <img src={imagesList[currentImageIndex]} alt={product?.name} className="w-full h-full object-cover transition-all duration-300" />
                
                {imagesList.length > 1 && (
                  <>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? imagesList.length - 1 : prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.Back />
                    </button>
                    <button 
                      onClick={() => setCurrentImageIndex(prev => prev === imagesList.length - 1 ? 0 : prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity rotate-180"
                    >
                      <Icons.Back />
                    </button>
                    
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imagesList.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'border border-white bg-white/30'}`}></div>
                      ))}
                    </div>
                    <div className="absolute bottom-3 left-4 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                      {currentImageIndex + 1}/{imagesList.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <span className="text-6xl">🌱</span>
            )}
            <span className="absolute top-3 left-3 bg-[#166534] text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
              <Icons.Leaf className="w-3 h-3" /> Organic
            </span>
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button onClick={toggleWishlist} className="bg-white p-2.5 rounded-full shadow-sm text-gray-700 hover:text-red-500 cursor-pointer transition-colors">
                <Icons.Heart filled={isLiked} className={isLiked ? "fill-red-500 text-red-500" : ""} />
              </button>
              <button onClick={handleShare} className="bg-white p-2.5 rounded-full shadow-sm text-gray-700 hover:text-blue-500 cursor-pointer transition-colors">
                <Icons.Share />
              </button>
            </div>
          </div>

          {/* Title & Info */}
          <div className="mb-1 text-sm text-gray-500">{farmerName}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
          
          <div className="inline-flex bg-green-50 text-green-800 text-xs px-2.5 py-1 rounded-full mb-3 font-medium items-center gap-1">
             <Icons.Leaf className="w-3 h-3"/> {categoryName || 'Product'}
          </div>

          <div className="flex items-center gap-2 mb-4">
             <div className="flex gap-0.5">
               {[1,2,3,4,5].map(i => (
                 <Icons.Star key={i} className="w-4 h-4" filled={i <= Math.floor(avgRating)} half={i === Math.ceil(avgRating) && !Number.isInteger(avgRating)} />
               ))}
             </div>
             <span className="text-sm font-bold text-blue-600">{avgRating.toFixed(1)}</span>
             <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
          </div>

          <div className="flex items-end gap-1 mb-1.5">
            <span className="text-3xl font-bold text-[#166534]">₹{Number(price || 0).toFixed(2)}</span>
            <span className="text-gray-500 font-medium mb-1.5">/ {product.unit || 'unit'}</span>
          </div>
          
          <div className="text-sm text-[#166534] font-bold mb-5 flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#166534] rounded-full inline-block mask mask-leaf" style={{WebkitMaskImage: 'url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\'/%3E%3Cpath d=\'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\'/%3E%3C/svg%3E\")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat'}}></span>
            <Icons.Leaf className="w-3.5 h-3.5 fill-current" /> {stock} {product.unit || 'unit'} available
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-3">
              <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden w-[120px] shrink-0 h-[48px]">
                <button onClick={decreaseQty} className="flex-1 h-full flex items-center justify-center text-gray-600 text-xl hover:bg-gray-50 cursor-pointer">−</button>
                <span className="flex-1 text-center font-bold text-gray-900">{quantity}</span>
                <button onClick={increaseQty} className="flex-1 h-full flex items-center justify-center text-gray-600 text-xl hover:bg-gray-50 cursor-pointer">+</button>
              </div>
              <button 
                onClick={handleAdd} 
                disabled={stock <= 0}
                className={`flex-1 rounded-xl font-bold flex items-center justify-center gap-2 h-[48px] transition-colors ${stock > 0 ? 'bg-[#166534] text-white hover:bg-green-900 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                <Icons.Cart className="w-5 h-5"/> Add to Cart
              </button>
            </div>
            <button 
              onClick={handleBuyNow} 
              disabled={stock <= 0}
              className={`w-full rounded-xl font-bold flex items-center justify-center gap-2 h-[48px] transition-colors ${stock > 0 ? 'bg-[#f59e0b] text-white hover:bg-[#d97706] cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Buy Now
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-4 gap-2 mb-6 border border-gray-100 rounded-xl p-4 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col items-center justify-center text-center gap-1.5">
              <Icons.Leaf className="w-6 h-6 text-gray-600"/>
              <span className="text-[10px] text-gray-600 font-medium">100% Organic</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5">
              <Icons.Shield className="w-6 h-6 text-gray-600"/>
              <span className="text-[10px] text-gray-600 font-medium">Safe for Soil</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5">
              <Icons.Plant className="w-6 h-6 text-gray-600"/>
              <span className="text-[10px] text-gray-600 font-medium">Better Yield</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5">
              <Icons.Truck className="w-6 h-6 text-gray-600"/>
              <span className="text-[10px] text-gray-600 font-medium">Fast Delivery</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-2 text-base">Product Description</h3>
            <p className={`text-sm text-gray-600 leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
              {product.description || 'A natural product made for improving soil health, root development and overall plant growth. Suitable for all types of crops.'}
            </p>
            {/* Added dummy features from image to make it look accurate if description is short */}
            {descExpanded && (!product.description || product.description.length < 100) && (
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc pl-4">
                <li>100% Organic</li>
                <li>Enhances soil fertility</li>
                <li>Improves plant growth and yield</li>
              </ul>
            )}
            <button 
              onClick={() => setDescExpanded(!descExpanded)} 
              className="text-[#166534] text-sm font-bold flex items-center gap-1 mt-2 cursor-pointer"
            >
              {descExpanded ? 'Read Less' : 'Read More'} <Icons.ChevronDown />
            </button>
          </div>

          {/* Reviews */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] mb-4">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-base">Customer Reviews</h3>
              {reviews.length > 0 && <button className="text-sm text-gray-500 font-medium flex items-center gap-0.5 cursor-pointer">See All <Icons.ChevronRight /></button>}
            </div>

            <div className="p-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No reviews yet</p>
              ) : (
                <>
                  <div className="flex gap-6 mb-6 items-center">
                    <div className="flex flex-col items-center justify-center w-24">
                      <span className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                      <div className="flex gap-0.5 my-1">
                        {[1,2,3,4,5].map(i => (
                          <Icons.Star key={i} className="w-3.5 h-3.5" filled={i <= Math.floor(avgRating)} half={i === Math.ceil(avgRating) && !Number.isInteger(avgRating)} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({reviews.length} reviews)</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1.5">
                      {[5,4,3,2,1].map(star => (
                         <div key={star} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                            <span className="w-4">{star} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                               <div className="h-full bg-[#166534] rounded-full" style={{width: `${(starCounts[star]/reviews.length)*100}%`}}></div>
                            </div>
                            <span className="w-5 text-right text-gray-500">{starCounts[star]}</span>
                         </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.slice(0, 3).map(review => (
                       <div key={review.id} className="border-t border-gray-100 pt-4">
                         <div className="flex gap-3 mb-2">
                           <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                             <Icons.User />
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="font-bold text-sm text-gray-900">{review.profiles?.full_name || 'Customer'}</span>
                               <span className="text-[10px] text-[#166534] font-bold flex items-center gap-0.5"><Icons.Shield className="w-3 h-3"/> Verified Buyer</span>
                             </div>
                             <div className="flex items-center gap-2 mt-0.5">
                               <div className="flex gap-0.5">
                                 {[1,2,3,4,5].map(i => (
                                   <Icons.Star key={i} className="w-3 h-3" filled={i <= (review.rating || 0)} />
                                 ))}
                               </div>
                               <span className="text-xs text-gray-400 font-medium">• {formatTimeAgo(review.created_at)}</span>
                             </div>
                           </div>
                         </div>
                         <p className="text-sm text-gray-700 leading-relaxed ml-13">
                           {review.review_text}
                         </p>
                       </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
