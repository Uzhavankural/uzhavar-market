"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/app/components/Toast";
import { useLanguage } from "@/app/context/LanguageContext";

export default function CustomerProfile() {
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  const [addr1, setAddr1] = useState({
    name: "",
    phone: "",
    address: "",
    village: "",
    district: "",
    pincode: "",
  });

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      const meta = authUser.user_metadata || {};
      setAddr1({
        name: profile?.full_name || meta.full_name || "",
        phone: profile?.phone || profile?.mobile || meta.phone || "",
        address: profile?.address || meta.address || "",
        village: profile?.village || meta.village || "",
        district: profile?.district || meta.district || "",
        pincode: profile?.pincode || meta.pincode || "",
      });

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
      alert(t("profile.maxAddresses"));
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
      if (!addr1.name || !addr1.address || !addr1.village || !addr1.district || !addr1.pincode) {
        alert(t("profile.fillMandatoryPrimary"));
        setSaving(false);
        return;
      }

      for (let i = 0; i < additionalAddresses.length; i++) {
        const ad = additionalAddresses[i];
        if (!ad.name || !ad.address || !ad.village || !ad.district || !ad.pincode) {
          alert(t("profile.fillMandatoryAdditional", { n: i + 1 }));
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: addr1.name,
            phone: addr1.phone,
            address: addr1.address,
            village: addr1.village,
            district: addr1.district,
            pincode: addr1.pincode,
            role: "customer",
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      localStorage.setItem(`uzhavar_customer_addresses_${user.id}`, JSON.stringify(additionalAddresses));

      const successMsg = `${t("profile.savedSuccess")} ✅`;
      setMessage(successMsg);
      showToast(successMsg, "success", 4000);
    } catch (error) {
      console.error("RAW ERROR OBJECT:", error);
      const errMsg = `Failed to save addresses: ${error.message || JSON.stringify(error)}`;
      setMessage(errMsg);
      showToast(errMsg, "error", 4000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-lg text-gray-500 animate-pulse">{t("profile.loadingProfile")}</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 m-0">{t("profile.title")}</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3 border-gray-100 flex items-center gap-2">
              <span>📍</span> {t("profile.primaryAddress")}{" "}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-auto">
                {t("profile.compulsory")}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.fullNameLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={addr1.name}
                  onChange={(e) => setAddr1({ ...addr1, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder={t("checkout.fullNamePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.phoneLabel")}
                </label>
                <input
                  type="text"
                  value={addr1.phone}
                  onChange={(e) => setAddr1({ ...addr1, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder={t("checkout.phonePlaceholder")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.houseAddressLabel")}
                </label>
                <textarea
                  required
                  value={addr1.address}
                  onChange={(e) => setAddr1({ ...addr1, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 min-h-[80px]"
                  placeholder={t("profile.housePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.villageLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={addr1.village}
                  onChange={(e) => setAddr1({ ...addr1, village: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder={t("profile.villagePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.districtLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={addr1.district}
                  onChange={(e) => setAddr1({ ...addr1, district: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder={t("profile.districtPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("profile.pincodeLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={addr1.pincode}
                  onChange={(e) => setAddr1({ ...addr1, pincode: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                  placeholder={t("profile.pincodePlaceholder")}
                />
              </div>
            </div>
          </div>

          {additionalAddresses.map((ad, index) => (
            <div key={index} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 relative">
              <button
                type="button"
                onClick={() => handleRemoveAddress(index)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 px-3 py-1 rounded-lg"
              >
                {t("common.remove")}
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-2 border-b pb-3 border-gray-100 flex items-center gap-2">
                <span>📍</span> {t("profile.additionalAddress", { n: index + 1 })}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.fullNameLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={ad.name}
                    onChange={(e) => handleAdditionalChange(index, "name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder={t("checkout.fullNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.phoneLabel")}
                  </label>
                  <input
                    type="text"
                    value={ad.phone}
                    onChange={(e) => handleAdditionalChange(index, "phone", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder={t("checkout.phonePlaceholder")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.houseAddressLabel")}
                  </label>
                  <textarea
                    required
                    value={ad.address}
                    onChange={(e) => handleAdditionalChange(index, "address", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1 min-h-[80px]"
                    placeholder={t("profile.housePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.villageLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={ad.village}
                    onChange={(e) => handleAdditionalChange(index, "village", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder={t("profile.villagePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.districtLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={ad.district}
                    onChange={(e) => handleAdditionalChange(index, "district", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder={t("profile.districtPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("profile.pincodeLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={ad.pincode}
                    onChange={(e) => handleAdditionalChange(index, "pincode", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-green-600 focus:ring-1"
                    placeholder={t("profile.pincodePlaceholder")}
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
              <span className="text-xl">+</span> {t("profile.addNewAddress")}
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-md transition-colors ${
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800"
            }`}
          >
            {saving ? t("profile.saving") : t("profile.saveAddresses")}
          </button>
        </form>
      </div>
    </main>
  );
}
