"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadCheckout();
  }, []);

  async function loadCheckout() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const cartKey = `uzhavar_cart_${user.id}`;
      const savedCart = localStorage.getItem(cartKey);

      if (!savedCart) {
        router.push("/customer/cart");
        return;
      }

      let parsedCart = [];

      try {
        parsedCart = JSON.parse(savedCart);
      } catch (error) {
        console.error("Cart parse error:", error);
      }

      if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
        router.push("/customer/cart");
        return;
      }

      setCart(parsedCart);

      // Load customer profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setCustomerName(profile.full_name || "");
        setPhone(profile.phone || profile.mobile || "");
        setAddress(profile.address || "");
      }
    } catch (error) {
      console.error("Checkout loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getCustomerPrice(item) {
    return (
      Number(item.price || 0) +
      Number(item.commission_amount || 0)
    );
  }

  function getItemTotal(item) {
    return (
      getCustomerPrice(item) * Number(item.quantity || 0) + Number(item.delivery_price || 0)
    );
  }

  const cartTotal = cart.reduce(
    (total, item) => total + getItemTotal(item),
    0
  );

  const totalDelivery = cart.reduce(
    (total, item) => total + Number(item.delivery_price || 0),
    0
  );

  async function handlePlaceOrder() {
    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    setPlacingOrder(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Authentication error.");
        setPlacingOrder(false);
        return;
      }

      // Group items by farmer_id
      const itemsByFarmer = {};
      cart.forEach((item) => {
        const fId = item.farmer_id;
        if (!itemsByFarmer[fId]) {
          itemsByFarmer[fId] = [];
        }
        itemsByFarmer[fId].push(item);
      });

      // Place order for each farmer
      for (const farmerId in itemsByFarmer) {
        const farmerItems = itemsByFarmer[farmerId];
        let orderTotalAmount = 0;
        let orderTotalCommission = 0;

        farmerItems.forEach((item) => {
          const itemTotal = getItemTotal(item);
          orderTotalAmount += itemTotal;

          const commAmount = Number(item.commission_amount || 0);
          orderTotalCommission += commAmount * Number(item.quantity || 1);
        });

        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: user.id,
            farmer_id: farmerId,
            total_amount: orderTotalAmount,
            status: "pending",
            delivery_address: address,
            customer_phone: phone,
            customer_name: customerName,
            commission_earned: orderTotalCommission,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItemsData = farmerItems.map((item) => {
          return {
            order_id: newOrder.id,
            product_id: item.id,
            quantity: item.quantity,
            price_at_time: Number(item.price || 0),
            commission_at_time: Number(item.commission_amount || 0),
            unit: item.unit || "unit",
            unit_count: Number(item.unit_count || 1),
            delivery_price: Number(item.delivery_price || 0),
            product_name: item.name,
            farm_name: item.farm_name,
            image_url: item.image_url,
          };
        });

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsData);

        if (itemsError) throw itemsError;
      }

      localStorage.removeItem(`uzhavar_cart_${user.id}`);
      router.push("/customer/orders");
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f8f5] font-sans">
        <p className="text-lg text-gray-600 font-medium animate-pulse">Loading checkout...</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#f6f8f5] px-4 py-10 sm:p-10 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty.</h1>
            <button
              onClick={() => router.push("/customer/products")}
              className="px-6 py-3 bg-green-700 text-white rounded-lg font-medium"
            >
              Go to Products
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-4 py-8 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push("/customer/cart")}
            className="text-gray-600 hover:text-green-800 font-medium text-sm sm:text-base transition-colors"
          >
            &larr; Back to Cart
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-4 m-0">
            Checkout
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <section className="flex-1 w-full bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">
              Delivery Details
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="Enter your full address"
              />
            </div>
          </section>

          <section className="w-full lg:w-[400px] bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-xl font-bold mb-6 border-b pb-2">
              Order Summary
            </h2>

            {cart.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🌾</span>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="m-0 mb-1 font-semibold">{item.name}</h4>
                  <p className="m-0 mb-1 text-gray-600 text-sm">
                    Qty: {item.quantity} × {item.unit_count || 1} {item.unit || "unit"}
                  </p>
                  <strong className="block text-gray-900">
                    ₹{getItemTotal(item).toFixed(2)}
                  </strong>
                </div>
              </div>
            ))}

            <div className="flex justify-between mb-3 text-gray-600">
              <span>Products</span>
              <span>{cart.length}</span>
            </div>

            <div className="flex justify-between mb-3 text-gray-600">
              <span>Delivery</span>
              {totalDelivery > 0 ? (
                <span className="text-gray-900 font-medium">₹{totalDelivery.toFixed(2)}</span>
              ) : (
                <span className="text-green-600 font-medium">Free</span>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className={`w-full mt-6 p-4 border-none rounded-lg bg-green-700 text-white text-lg font-bold transition-colors ${
                placingOrder ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-green-800"
              }`}
            >
              {placingOrder
                ? "Placing Order..."
                : `Place Order • ₹${cartTotal.toFixed(2)}`}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
