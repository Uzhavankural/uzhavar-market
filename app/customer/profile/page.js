"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CustomerProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  // Address 1 (Compulsory - saved to Supabase profiles)
  const [addr1, setAddr1] = useState({
    name: "",
    phone: "",
    address: "",
    village: "",
    district: "",
    pincode: "",
  });

  // Additional Addresses (Optional - up to 2, saved to localStorage)
  const [additionalAddresses, setAdditionalAddresses] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }
      setUser(authUser);

      // Load Primary Address from Supabase
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        setAddr1({
          name: profile.full_name || "",
          phone: profile.phone || profile.mobile || "",
          address: profile.address || "",
          village: profile.village || "",
          district: profile.district || "",
          pincode: profile.pincode || "",
        });
      }

      // Load Additional Addresses from localStorage
      const localAddresses = localStorage.getItem(`uzhavar_customer_addresses_${authUser.id}`);
      if (localAddresses) {
        setAdditionalAddresses(JSON.parse(localAddresses));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddAddress() {
    if (additionalAddresses.length >= 2) {
      alert("You can only add up to 2 additional addresses.");
      return;
    }
    setAdditionalAddresses([
      ...additionalAddresses,
      { name: "", phone: "", address: "", village: "", district: "", pincode: "" },
    ]);
  }

  function handleRemoveAddress(index) {
    const updated = [...additionalAddresses];
    updated.splice(index, 1);
    setAdditionalAddresses(updated);
  }

  function handleAdditionalChange(index, field, value) {
    const updated = [...additionalAddresses];
    updated[index][field] = value;
    setAdditionalAddresses(updated);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Validate Compulsory Address
      if (!addr1.name || !addr1.address || !addr1.village || !addr1.district || !addr1.pincode) {
        alert("Please fill all mandatory fields for the primary delivery address.");
        setSaving(false);
        return;
      }

      // Validate Additional Addresses
      for (let i = 0; i < additionalAddresses.length; i++) {
        const ad = additionalAddresses[i];
        if (!ad.name || !ad.address || !ad.village || !ad.district || !ad.pincode) {
          alert(`Please fill all mandatory fields for Additional Address ${i + 1}.`);
          setSaving(false);
          return;
        }
      }

      // Save Primary to Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: addr1.name,
          phone: addr1.phone,
          address: addr1.address,
          village: addr1.village,
          district: addr1.district,
          pincode: addr1.pincode,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Save Additional to LocalStorage
      localStorage.setItem(`uzhavar_customer_addresses_${user.id}`, JSON.stringify(additionalAddresses));

      setMessage("Addresses saved successfully! ✅");
    } catch (error) {
      console.error("RAW ERROR OBJECT:", error);
      console.error("Save error keys:", Object.keys(error));
      console.error("Save error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setMessage(`Failed to save addresses: ${error.message || JSON.stringify(error)}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-lg text-gray-500 animate-pulse">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-10 font-sans pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/customer")}
            className="text-gray-500 hover:text-green-800 text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            &larr;
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 m-0">My Profile</h1>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-800 border border-green-200 font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Primary Address */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3 border-gray-100 flex items-center gap-2">
              <span>📍</span> Primary Delivery Address <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-auto">Compulsory</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={addr1.name}
                  onChange={(e) => setAddr1({ ...addr1, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={addr1.phone}
                  onChange={(e) => setAddr1({ ...addr1, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder="Mobile Number"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">House Address *</label>
                <textarea
                  required
                  value={addr1.address}
                  onChange={(e) => setAddr1({ ...addr1, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 min-h-[80px]"
                  placeholder="Flat, House no., Building, Company, Apartment"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Village/Town *</label>
                <input
                  type="text"
                  required
                  value={addr1.village}
                  onChange={(e) => setAddr1({ ...addr1, village: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder="Area, Street, Sector, Village"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={addr1.district}
                  onChange={(e) => setAddr1({ ...addr1, district: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder="District / City"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  value={addr1.pincode}
                  onChange={(e) => setAddr1({ ...addr1, pincode: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder="6 digits [0-9] PIN code"
                />
              </div>
            </div>
          </div>

          {/* Additional Addresses */}
          {additionalAddresses.map((ad, index) => (
            <div key={index} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 relative">
              <button
                type="button"
                onClick={() => handleRemoveAddress(index)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-3 py-1 rounded-lg"
              >
                Remove
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3 border-gray-100 flex items-center gap-2">
                <span>📍</span> Additional Address {index + 1}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={ad.name}
                    onChange={(e) => handleAdditionalChange(index, "name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={ad.phone}
                    onChange={(e) => handleAdditionalChange(index, "phone", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder="Mobile Number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">House Address *</label>
                  <textarea
                    required
                    value={ad.address}
                    onChange={(e) => handleAdditionalChange(index, "address", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 min-h-[80px]"
                    placeholder="Flat, House no., Building, Company, Apartment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Village/Town *</label>
                  <input
                    type="text"
                    required
                    value={ad.village}
                    onChange={(e) => handleAdditionalChange(index, "village", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder="Area, Street, Sector, Village"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={ad.district}
                    onChange={(e) => handleAdditionalChange(index, "district", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder="District / City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={ad.pincode}
                    onChange={(e) => handleAdditionalChange(index, "pincode", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder="6 digits [0-9] PIN code"
                  />
                </div>
              </div>
            </div>
          ))}

          {additionalAddresses.length < 2 && (
            <button
              type="button"
              onClick={handleAddAddress}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 font-bold hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> Add New Address
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-md transition-colors ${
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {saving ? "Saving..." : "Save Addresses"}
          </button>
        </form>
      </div>
    </main>
  );
}
