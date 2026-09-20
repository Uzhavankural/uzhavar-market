"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isManualAddress, setIsManualAddress] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      let addresses = [];

      if (profile && profile.address) {
        addresses.push({
          name: profile.full_name || "",
          phone: profile.phone || profile.mobile || "",
          address: profile.address || "",
          village: profile.village || "",
          district: profile.district || "",
          pincode: profile.pincode || ""
        });
      }

      const localAddresses = localStorage.getItem(`uzhavar_customer_addresses_${user.id}`);
      if (localAddresses) {
        try {
          const parsed = JSON.parse(localAddresses);
          if (Array.isArray(parsed)) {
            addresses = [...addresses, ...parsed];
          }
        } catch(e) {}
      }

      setSavedAddresses(addresses);

      if (addresses.length > 0) {
        setSelectedAddressIndex(0);
        setIsManualAddress(false);
        applyAddress(addresses[0]);
      } else {
        setSelectedAddressIndex(-1);
        setIsManualAddress(true);
      }
    } catch (error) {
      console.error("Checkout loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyAddress(addr) {
    setCustomerName(addr.name || "");
    setPhone(addr.phone || "");
    setAddress(addr.address || "");
    setVillage(addr.village || "");
    setDistrict(addr.district || "");
    setPincode(addr.pincode || "");
  }

  function handleSelectAddress(index) {
    if (index === -1) {
      setSelectedAddressIndex(-1);
      setIsManualAddress(true);
      setCustomerName("");
      setPhone("");
      setAddress("");
      setVillage("");
      setDistrict("");
      setPincode("");
    } else {
      setSelectedAddressIndex(index);
      setIsManualAddress(false);
      applyAddress(savedAddresses[index]);
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
      alert("Please enter your house/street address.");
      return;
    }

    if (!village.trim()) {
      alert("Please enter your village/town.");
      return;
    }

    if (!district.trim()) {
      alert("Please enter your district.");
      return;
    }

    if (!pincode.trim()) {
      alert("Please enter your pincode.");
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

      if (isManualAddress) {
        if (savedAddresses.length === 0) {
          try {
            const { error: profileUpdateError } = await supabase.from("profiles").update({
              full_name: customerName,
              phone: phone,
              address: address,
              village: village,
              district: district,
              pincode: pincode
            }).eq("id", user.id);
            if (profileUpdateError) throw profileUpdateError;
          } catch(e) {
            console.error("Failed to update profile silently:", e);
          }
        } else if (savedAddresses.length < 3) {
          const newLocalAddr = {
            name: customerName,
            phone: phone,
            address: address,
            village: village,
            district: district,
            pincode: pincode
          };
          const existingLocal = localStorage.getItem(`uzhavar_customer_addresses_${user.id}`);
          let parsedLocal = [];
          if (existingLocal) {
            try { parsedLocal = JSON.parse(existingLocal); } catch(e){}
          }
          parsedLocal.push(newLocalAddr);
          localStorage.setItem(`uzhavar_customer_addresses_${user.id}`, JSON.stringify(parsedLocal));
        }
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
            total_amount: orderTotalAmount,
            order_status: "pending",
            delivery_address: address,
            district: district,
            village: village,
            customer_phone: phone,
            customer_name: customerName,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItemsData = farmerItems.map((item) => {
          const itemPrice = Number(item.price || 0);
          const itemComm = Number(item.commission_amount || 0);
          const itemQty = Number(item.quantity || 1);
          
          return {
            order_id: newOrder.id,
            farmer_id: farmerId,
            product_id: item.id,
            product_name: item.name,
            price: itemPrice,
            quantity: itemQty,
            unit: item.unit || "unit",
            item_total: itemPrice * itemQty,
            commission_amount: itemComm,
            farmer_price: itemPrice - itemComm,
            settlement_status: "pending",
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
      alert(`Failed to place order: ${error.message || JSON.stringify(error)}`);
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
            <h2 className="text-xl font-bold mb-6 border-b pb-2 flex justify-between items-center">
              Delivery Details
              <button 
                onClick={() => router.push("/customer/profile")}
                className="text-sm text-green-700 hover:underline font-medium"
              >
                Manage Addresses
              </button>
            </h2>

            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Delivery Address
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectAddress(idx)}
                      className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedAddressIndex === idx
                          ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <strong className="text-gray-900">{addr.name}</strong>
                        {idx === 0 && (
                          <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2 mb-1">{addr.address}</div>
                      <div className="text-sm text-gray-600">{addr.village}, {addr.district} - {addr.pincode}</div>
                    </div>
                  ))}
                  
                  {savedAddresses.length > 0 && (
                    <div
                      onClick={() => handleSelectAddress(-1)}
                      className={`p-4 border rounded-xl cursor-pointer transition-colors flex items-center justify-center font-semibold ${
                        selectedAddressIndex === -1
                          ? "border-green-600 bg-green-50 ring-1 ring-green-600 text-green-800"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      + Deliver to another location
                    </div>
                  )}
                </div>
              </div>
            )}

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
                House / Street Address *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg min-h-[80px] outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="Enter your house no, street name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Village / Town *
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  placeholder="e.g. Omalur"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  District *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  placeholder="e.g. Salem"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                placeholder="e.g. 636001"
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
