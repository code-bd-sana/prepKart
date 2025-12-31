"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  X,
  Bookmark,
  Crown,
  Calendar,
  MapPin,
  Mail,
  Utensils,
  Heart,
  DollarSign,
} from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardModal({ isOpen, onClose, locale }) {
  const modalRef = useRef(null);
  const searchParams = useSearchParams();
  const groceryListIdFromURL = searchParams.get("groceryListId");
  const [activeTab, setActiveTab] = useState("Meal Plans");
  const [savedMealPlans, setSavedMealPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pantry, setPantry] = useState(null);
  const [pantryLoading, setPantryLoading] = useState(true);
  const [newPantryItem, setNewPantryItem] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
  });
  // Get user data from Redux
  const { user, loading: userLoading } = useSelector((state) => state.auth);
  const router = useRouter();

  // Fetch saved meal plans when modal opens
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchSavedPlans = async () => {
      setLoading(true);
      try {
        // Get token from localStorage
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        if (!token) {
          console.log("No token found, user might not be logged in");
          setSavedMealPlans([]);
          return;
        }

        const response = await fetch(`/api/plans?userId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log("User not authenticated");
            setSavedMealPlans([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const allPlans = await response.json();

        // Filter only saved plans
        const savedPlans = allPlans.filter((plan) => {
          return (
            plan.isSaved === true ||
            (plan.title && plan.title.toLowerCase().includes("quick"))
          );
        });

        setSavedMealPlans(savedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setSavedMealPlans([]);
      } finally {
        setLoading(false);
      }
    };
    const fetchPantry = async () => {
      if (user?.tier === "free") {
        setPantryLoading(false);
        return;
      }

      try {
        setPantryLoading(true);

        // Get token from localStorage
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          "";

        const response = await fetch("/api/pantry", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPantry(data.pantry || data);
        }
      } catch (error) {
        console.error("Error fetching pantry:", error);
      } finally {
        setPantryLoading(false);
      }
    };

    fetchSavedPlans();
    fetchPantry();

    if (groceryListIdFromURL) {
      setGroceryListId(groceryListIdFromURL);
    }
  }, [isOpen, user?.id, groceryListIdFromURL, user?.tier]);

  const handleClickOutside = useCallback(
    (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    },
    [onClose]
  );

  // Pantry functions
  const addPantryItem = async () => {
    if (!newPantryItem.name.trim()) {
      // Use your toast or alert
      console.error("Please enter an item name");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";

      const response = await fetch("/api/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: [newPantryItem],
          action: "add",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPantry(data.pantry || data);
        setNewPantryItem({ name: "", quantity: 1, unit: "unit" });
        // toast.success("Item added to pantry");
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const removePantryItem = async (itemName) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";

      const response = await fetch("/api/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: [{ name: itemName }],
          action: "remove",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPantry(data.pantry || data);
        // toast.success("Item removed from pantry");
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };
  // useEffect(() => {
  //   if (isOpen && !user) {
  //     onClose();
  //     // Optional: redirect to login
  //     // router.push(`/${locale}/login`);
  //   }
  // }, [isOpen, user, onClose, locale]);

  useEffect(() => {
    if (isOpen && !user) {
      onClose();
      // Optional: redirect to login
      // router.push(`/${locale}/login`);
    }
    if (isOpen && user) {
      console.log("User tier:", user.tier);

      if (user.tier === "admin" || user.role === "admin") {
        console.log("Admin detected, redirecting...");
        onClose();

        setTimeout(() => {
          window.location.href = "/";
        }, 100);

        return;
      }
    }
  }, [isOpen, user, onClose, locale]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  if (!isOpen) return null;

  const tabs = ["Meal Plans", "Nutrition", "Calendar", "Budget", "Pantry"];

  const tierConfig = {
    free: {
      name: "Free Plan",
      color: "bg-[#EDF7E0] text-black",
      displayName: "Free",
    },
    tier2: {
      name: "Plus Plan",
      color: "bg-[#D9ECF9] text-black",
      displayName: "Plus",
    },
    tier3: {
      name: "Premium Plan",
      color: "bg-black text-white",
      displayName: "Premium",
    },
  };

  const currentTier = user?.tier || "free";
  const tierInfo = tierConfig[currentTier];

  // Helper function to get emoji for plan goal
  const getGoalEmoji = (goal) => {
    if (!goal) return "🍽️";

    const goalLower = goal.toLowerCase();
    switch (goalLower) {
      case "muscle gain":
        return "💪";
      case "weight loss":
        return "⚖️";
      case "healthy eating":
        return "🥗";
      case "family meals":
        return "👨‍👩‍👧‍👦";
      case "vegetarian":
        return "🥦";
      case "vegan":
        return "🌱";
      default:
        return "🍽️";
    }
  };

  // Count total meals in a plan
  const countTotalMeals = (plan) => {
    if (!plan?.days || !Array.isArray(plan.days)) return 0;

    return plan.days.reduce((total, day) => {
      if (day?.meals && Array.isArray(day.meals)) {
        return total + day.meals.length;
      }
      return total;
    }, 0);
  };

  // Calculate total nutrition across all saved plans
  const calculateTotalNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let planCount = 0;

    savedMealPlans.forEach((plan) => {
      plan.days?.forEach((day) => {
        day.meals?.forEach((meal) => {
          if (meal.nutrition) {
            totalCalories += meal.nutrition.calories || 0;
            totalProtein += meal.nutrition.protein_g || 0;
            totalCarbs += meal.nutrition.carbs_g || 0;
            totalFat += meal.nutrition.fat_g || 0;
            planCount++;
          }
        });
      });
    });

    return {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      averageCalories:
        planCount > 0 ? Math.round(totalCalories / planCount) : 0,
      planCount,
    };
  };

  // Calculate total budget
  const calculateBudget = () => {
    let totalCost = 0;
    const budgetLevels = {
      Low: 50,
      Medium: 75,
      High: 100,
    };

    savedMealPlans.forEach((plan) => {
      const budgetLevel = plan.inputs?.budget_level || "Medium";
      const days = plan.days?.length || 0;
      const portions = plan.inputs?.portions || 2;

      // Simple calculation: budget level * days * portions
      const dailyCost = budgetLevels[budgetLevel] || 75;
      totalCost += dailyCost * days * portions;
    });

    return {
      totalCost: Math.round(totalCost),
      averageDailyCost:
        savedMealPlans.length > 0
          ? Math.round(totalCost / savedMealPlans.length)
          : 0,
    };
  };

  // Get favorite recipes
  const getFavoriteRecipes = () => {
    const favorites = [];
    savedMealPlans.forEach((plan) => {
      plan.days?.forEach((day) => {
        day.meals?.forEach((meal) => {
          if (meal.recipeName) {
            favorites.push({
              name: meal.recipeName,
              planTitle: plan.title,
              mealType: meal.mealType,
              cookingTime: meal.cookingTime,
            });
          }
        });
      });
    });

    // Remove duplicates
    const uniqueFavorites = [];
    const seen = new Set();

    favorites.forEach((fav) => {
      const key = `${fav.name}-${fav.mealType}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFavorites.push(fav);
      }
    });

    return uniqueFavorites.slice(0, 10); // Return top 10
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Check if plan is expired
  const isPlanExpired = (plan) => {
    if (!plan?.expiresAt) return false;
    const now = new Date();
    const expires = new Date(plan.expiresAt);
    return now > expires;
  };

  // Get stats
  const nutritionStats = calculateTotalNutrition();
  const budgetStats = calculateBudget();
  const favoriteRecipes = getFavoriteRecipes();

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Nutrition":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">
                  Total Calories
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {nutritionStats.totalCalories}
                </p>
                <p className="text-xs text-gray-500">Across all saved plans</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  Total Protein
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {nutritionStats.totalProtein}g
                </p>
                <p className="text-xs text-gray-500">Across all saved plans</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <p className="text-sm text-purple-600 font-medium">
                  Average Calories
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {nutritionStats.averageCalories}
                </p>
                <p className="text-xs text-gray-500">Per meal plan</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl">
                <p className="text-sm text-amber-600 font-medium">
                  Meals Analyzed
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {nutritionStats.planCount}
                </p>
                <p className="text-xs text-gray-500">
                  Total meals in saved plans
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Nutrition Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Protein
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {nutritionStats.totalProtein}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (nutritionStats.totalProtein / 500) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Carbs
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {nutritionStats.totalCarbs}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (nutritionStats.totalCarbs / 1000) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      Fat
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {nutritionStats.totalFat}g
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (nutritionStats.totalFat / 300) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Pantry":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Pantry</h1>
              <p className="text-gray-600 mt-2">
                Manage items you already have at home. These will be excluded
                from grocery lists when pantry toggle is enabled.
              </p>
            </div>

            {/* Upgrade message for free users */}
            {user?.tier === "free" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                  Pantry Feature Unlocked
                </h2>
                <p className="text-yellow-700 mb-4">
                  The pantry feature is only available for Plus and Premium
                  users.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/${locale}/#pricing`);
                  }}
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Upgrade Now
                </button>
              </div>
            ) : (
              <>
                {/* Add Item Form */}
                <div className="bg-white rounded-xl shadow-md p-6">
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
                        value={newPantryItem.name}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
                            name: e.target.value,
                          })
                        }
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
                        value={newPantryItem.quantity}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
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
                        value={newPantryItem.unit}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
                            unit: e.target.value,
                          })
                        }
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
                        onClick={addPantryItem}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Add to Pantry
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pantry Items */}
                {pantryLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  </div>
                ) : pantry?.items && pantry.items.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Pantry Items ({pantry.items.length})
                      </h2>
                      <span className="text-sm text-gray-500">
                        Last updated:{" "}
                        {new Date(pantry.lastSynced).toLocaleDateString()}
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
                              <h3 className="font-medium text-gray-900">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <button
                              onClick={() => removePantryItem(item.name)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {item.category || "Uncategorized"}
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
                      Add items you already have at home to exclude them from
                      grocery lists.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case "Calendar":
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Meal Plan Calendar
              </h3>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-medium text-gray-700 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
                {Array.from({ length: 35 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 border border-gray-200 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-700">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">
                  Upcoming Expiring Plans
                </h4>
                {savedMealPlans
                  .filter((plan) => !isPlanExpired(plan))
                  .slice(0, 3)
                  .map((plan) => (
                    <div
                      key={plan._id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {plan.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires: {formatDate(plan.expiresAt)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      case "Budget":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">
                    Total Estimated Cost
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${budgetStats.totalCost}
                </p>
                <p className="text-xs text-gray-500">
                  For all saved meal plans
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">
                    Average Daily Cost
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${budgetStats.averageDailyCost}
                </p>
                <p className="text-xs text-gray-500">Per plan</p>
              </div>

              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Utensils className="w-6 h-6 text-purple-600" />
                  <p className="text-sm text-purple-600 font-medium">
                    Plans by Budget Level
                  </p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    savedMealPlans.filter(
                      (p) => p.inputs?.budget_level === "Low"
                    ).length
                  }{" "}
                  Low
                </p>
                <p className="text-xs text-gray-500">
                  {
                    savedMealPlans.filter(
                      (p) => p.inputs?.budget_level === "Medium"
                    ).length
                  }{" "}
                  Medium •
                  {
                    savedMealPlans.filter(
                      (p) => p.inputs?.budget_level === "High"
                    ).length
                  }{" "}
                  High
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Budget Breakdown
              </h3>
              <div className="space-y-4">
                {savedMealPlans.slice(0, 5).map((plan) => {
                  const budgetLevel = plan.inputs?.budget_level || "Medium";
                  const budgetColors = {
                    Low: "bg-green-500",
                    Medium: "bg-yellow-500",
                    High: "bg-red-500",
                  };

                  return (
                    <div
                      key={plan._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {plan.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {plan.days?.length || 0} days •{" "}
                          {plan.inputs?.portions || 2} portions
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            budgetLevel === "Low"
                              ? "bg-green-100 text-green-800"
                              : budgetLevel === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {budgetLevel} Budget
                        </span>
                        <span className="font-semibold text-gray-900">
                          $
                          {budgetLevel === "Low"
                            ? 50
                            : budgetLevel === "High"
                            ? 100
                            : 75}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "Pantry":
        return (
          <div className="space-y-6">
            {/* Upgrade message for free users */}
            {user?.tier === "free" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                  Pantry Feature Unlocked
                </h2>
                <p className="text-yellow-700 mb-4">
                  The pantry feature is only available for Plus and Premium
                  users.
                </p>
              </div>
            ) : (
              <>
                {/* Add Item Form */}
                <div className="bg-white rounded-xl shadow-md p-6 ">
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
                        defaultValue="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
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
                      <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium">
                        Add to Pantry
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pantry Items */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-64">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      My Pantry Items (0)
                    </h2>
                    <span className="text-sm text-gray-500">
                      Last updated: {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏪</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Your pantry is empty
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Add items you already have at home to exclude them from
                      grocery lists.
                    </p>
                  </div>

                  {/* Link to full pantry page */}
                  {/* <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <Link
                      href={`/${locale}/pantry`}
                      className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
                    >
                      View Full Pantry Page →
                    </Link>
                  </div> */}
                </div>
              </>
            )}
          </div>
        );
      case "Meal Plans":
      default:
        const regularSavedPlans = savedMealPlans.filter(
          (plan) =>
            plan.isSaved === true &&
            !plan.title?.toLowerCase().includes("quick")
        );

        const quickSavedPlans = savedMealPlans.filter((plan) =>
          plan.title?.toLowerCase().includes("quick")
        );

        return (
          <>
            <div>
              {/* Plan Status Card - Always show */}
              <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Plan
                  </h2>
                  <div
                    className={`px-4 py-2 rounded-lg ${tierInfo.color} font-medium`}
                  >
                    {tierInfo.displayName} Plan
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-blue-600 font-medium">
                      Monthly Plans Used
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user?.monthly_plan_count ||
                        user?.planGenerationCount ||
                        0}
                    </p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-green-600 font-medium">
                      Swaps Used
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user?.preferences?.swapsUsed || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      of {user?.preferences?.swapsAllowed || 3} allowed
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-purple-600 font-medium">
                      Saved Plans
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {savedMealPlans.length}
                    </p>
                    <p className="text-xs text-gray-500">Total saved</p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="text-sm text-amber-600 font-medium">
                      Last Login
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user?.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </p>
                    <p className="text-xs text-gray-500">Recent activity</p>
                  </div>
                </div>
              </div>

              {/* REGULAR SAVED PLANS SECTION */}
              {regularSavedPlans.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Regular Saved Plans ({regularSavedPlans.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularSavedPlans.map((plan) => {
                      const isExpired = isPlanExpired(plan);
                      return (
                        <div
                          key={plan._id}
                          className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow min-h-[400px] flex flex-col mb-8 ${
                            isExpired
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          {isExpired && (
                            <div className="mb-3 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full inline-flex items-center">
                              <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                              Expired
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {getGoalEmoji(plan.inputs?.goal)}
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {plan.title}
                                </h3>
                                <span className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded-full">
                                  {plan.inputs?.goal || "Custom Plan"}
                                </span>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Bookmark className="w-5 h-5 text-teal-600 fill-teal-600" />
                            </button>
                          </div>

                          <div className="space-y-2 mb-6 grow">
                            <p className="text-sm text-gray-600">
                              Created: {formatDate(plan.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {countTotalMeals(plan)} meals •{" "}
                              {plan.days?.length || 0} days
                            </p>
                            <p className="text-sm text-gray-600">
                              Portions: {plan.inputs?.portions || 2} • Budget:{" "}
                              {plan.inputs?.budget_level || "Medium"}
                            </p>
                            {plan.inputs?.cuisine && (
                              <p className="text-sm text-gray-600">
                                Cuisine: {plan.inputs.cuisine}
                              </p>
                            )}
                          </div>

                          <div className="mt-auto">
                            <Link
                              className="w-full block"
                              href={`/${locale}/plans/${plan._id}${
                                plan.groceryListId
                                  ? `?groceryListId=${plan.groceryListId}`
                                  : ""
                              }`}
                            >
                              <button className="w-full bg-white border border-gray-300 text-gray-700 px-7 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                View Plan
                              </button>
                            </Link>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                            <span>
                              Swaps: {plan.swapsUsed || 0}/
                              {plan.swapsAllowed || 3}
                            </span>
                            <span>Source: {plan.source || "OpenAI"}</span>
                            <span>
                              {isExpired ? (
                                <span className="text-red-500">Expired</span>
                              ) : plan.expiresAt ? (
                                `Expires: ${formatDate(plan.expiresAt)}`
                              ) : (
                                "No expiry"
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUICK SAVED PLANS SECTION */}
              {quickSavedPlans.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Quick Saved Plans ({quickSavedPlans.length})
                    </h2>
                    <span className="text-sm text-gray-500">
                      Generated from quick plan feature
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickSavedPlans.map((plan) => {
                      const isExpired = isPlanExpired(plan);
                      return (
                        <div
                          key={plan._id}
                          className={`bg-white border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow min-h-[400px] flex flex-col ${
                            isExpired ? "border-red-300 bg-red-50" : ""
                          }`}
                        >
                          {isExpired && (
                            <div className="mb-3 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full inline-flex items-center">
                              <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                              Expired
                            </div>
                          )}

                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">⚡</div>
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {plan.title}
                                </h3>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  Quick Plan
                                </span>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
                            </button>
                          </div>

                          <div className="space-y-2 mb-6 grow">
                            <p className="text-sm text-gray-600">
                              Created: {formatDate(plan.createdAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {countTotalMeals(plan)} meals •{" "}
                              {plan.days?.length || 0} days
                            </p>
                            <p className="text-sm text-gray-600">
                              {plan.swapsAllowed || 0} swaps available
                            </p>
                            {plan.source && (
                              <p className="text-sm text-gray-600">
                                Source: {plan.source}
                              </p>
                            )}
                          </div>

                          <div className="mt-auto">
                            <Link
                              className="w-full block"
                              href={`/${locale}/plans/${plan._id}`}
                            >
                              <button className="w-full bg-blue-600 text-white px-7 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                                View Quick Plan
                              </button>
                            </Link>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                            <span>
                              Swaps: {plan.swapsUsed || 0}/
                              {plan.swapsAllowed || 3}
                            </span>
                            <span>Source: {plan.source || "OpenAI"}</span>
                            <span>
                              {isExpired ? (
                                <span className="text-red-500">Expired</span>
                              ) : plan.expiresAt ? (
                                `Expires: ${formatDate(plan.expiresAt)}`
                              ) : (
                                "30 days from creation"
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {regularSavedPlans.length === 0 &&
                quickSavedPlans.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No saved meal plans yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {currentTier === "free"
                        ? "Free users cannot save meal plans. Upgrade to Plus or Premium to save your plans."
                        : "Create and save your first meal plan to get started!"}
                    </p>
                    {currentTier === "free" ? (
                      <button
                        onClick={() => {
                          onClose();
                          router.push(`/${locale}/#pricing`);
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
                      >
                        <Crown className="inline w-5 h-5 mr-2" />
                        Upgrade to Save Plans
                      </button>
                    ) : (
                      <button className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium">
                        Create First Plan to View
                      </button>
                    )}
                  </div>
                )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl w-full max-w-[1400px] max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div className="bg-linear-to-r from-teal-500 to-emerald-400 px-8 py-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {user?.name || "User"}s Dashboard
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-white/90">
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{user?.email}</span>
                </div>
                {user?.province && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{user.province}</span>
                  </div>
                )}
                {user?.createdAt && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {formatDate(user.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Show Upgrade button only if not Premium */}
              {currentTier !== "tier3" && (
                <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg">
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-teal-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 min-h-[600px]">
          <div className="max-w-7xl mx-auto h-full">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}
