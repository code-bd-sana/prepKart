"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PantryPage() {
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("register");
  const { user } = useSelector((state) => state.auth);
  const [pantry, setPantry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
  });

  useEffect(() => {
    const loadPantry = async () => {
      if (user && user.tier !== "free") {
        try {
          setLoading(true);

          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            "";

          // Fetch with auth headers
          const response = await fetch("/api/pantry", {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          const data = await response.json();

          if (response.ok) {
            setPantry(data.pantry);
          } else {
            toast.error(data.error || "Failed to load pantry");
          }
        } catch (error) {
          toast.error("Error loading pantry");
        } finally {
          setLoading(false);
        }
      }
    };

    loadPantry();
  }, [user]);

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") || localStorage.getItem("accessToken") || ""
    );
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    return fetch(url, { ...options, headers });
  };

  const addItem = async () => {
    if (!newItem.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const response = await fetchWithAuth("/api/pantry", {
        method: "POST",
        body: JSON.stringify({
          items: [newItem],
          action: "add",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPantry(data.pantry);
        setNewItem({ name: "", quantity: 1, unit: "unit" });
        toast.success("Item added to pantry");
      } else {
        toast.error(data.error || "Failed to add item");
      }
    } catch (error) {
      toast.error("Error adding item");
    }
  };

  const removeItem = async (itemName) => {
    try {
      const response = await fetchWithAuth("/api/pantry", {
        method: "POST",
        body: JSON.stringify({
          items: [{ name: itemName }],
          action: "remove",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPantry(data.pantry);
        toast.success("Item removed from pantry");
      } else {
        toast.error(data.error || "Failed to remove item");
      }
    } catch (error) {
      toast.error("Error removing item");
    }
  };
  if (user?.tier === "free") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Pantry Feature Unlocked
          </h2>
          <p className="text-yellow-700 mb-4">
            The pantry feature is only available for Plus and Premium users.
          </p>
          <Link
            href="/#pricing"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="bg-white rounded-xl shadow-lg mb-6 max-w-[1500px] mx-auto p-4 mt-6">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft />
            {t("backToHome")}
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          My Pantry
        </h1>
        <p className="text-gray-600">
          Manage items you already have at home. These will be excluded from
          grocery lists when pantry toggle is enabled.
        </p>
      </div>

      {/* Add Item Form */}
      <div className="bg-white rounded-xl shadow-md mb-6 max-w-[1500px] mx-auto p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Add New Item
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g., Rice, Olive Oil, Eggs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={newItem.quantity}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  quantity: parseFloat(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="unit">unit</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={addItem}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Add to Pantry
            </button>
          </div>
        </div>
      </div>

      {/* Pantry Items */}
      {pantry?.items && pantry.items.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md max-w-[1500px] mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pantry Items ({pantry.items.length})
            </h2>
            <span className="text-sm text-gray-500">
              Last updated: {new Date(pantry.lastSynced).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pantry.items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.name)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {item.category}
                  </span>
                  <span className="text-gray-500">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Your pantry is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Add items you already have at home to exclude them from grocery
            lists.
          </p>
        </div>
      )}
    </div>
  );
}
