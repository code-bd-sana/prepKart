"use client";

import { useEffect, useState } from "react";
import {
  PROVINCES,
  GOALS,
  BUDGET_LEVELS,
  SKILL_LEVELS,
  DIETARY_PREFERENCES,
  ALLERGIES,
} from "@/lib/types";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function GenerateWeeklyPlan({ voiceText }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const { user } = useSelector((state) => state.auth);
  const [isSwapping, setIsSwapping] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [freeLimitReached, setFreeLimitReached] = useState(false);
  const t = useTranslations("generatePlan");
  const params = useParams();
  const locale = params.locale;

  // to recheck authentuication token
  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token && user) {
        if (user.token) {
          localStorage.setItem("token", user.token);
        }
      }
    };

    checkAuth();
  }, [user]);
  // Form state
  const [form, setForm] = useState({
    province: "Ontario",
    cuisine: "",
    goal: "",
    budgetLevel: "Medium",
    portions: 2,
    mealsPerDay: 3,
    likes: "",
    dislikes: "",
    cookingMethod: "",
    maxCookingTime: 30,
    skillLevel: "Beginner",
    dietaryPreferences: [],
    allergies: [],
    days_count: !user || user?.tier === "free" ? 3 : 7,
  });
  useEffect(() => {
    if (!voiceText) return;

    const text = voiceText.toLowerCase();

    setForm((prev) => ({
      ...prev,

      // province
      province: text.includes("alberta")
        ? "Alberta"
        : text.includes("british")
        ? "British Columbia"
        : text.includes("columbia")
        ? "British Columbia"
        : text.includes("manitoba")
        ? "Manitoba"
        : text.includes("New")
        ? "New Brunswick"
        : text.includes("Brunswick")
        ? "New Brunswick"
        : text.includes("yukon")
        ? "Yukon"
        : text.includes("nunavut")
        ? "Nunavut"
        : text.includes("quebec")
        ? "Quebec"
        : text.includes("columbia")
        ? "British Columbia"
        : prev.province,

      // Goal
      goal: text.includes("lose")
        ? "Weigth Loss"
        : text.includes("weigth")
        ? "Weigth Loss"
        : text.includes("muscle")
        ? "Muscle Gain"
        : text.includes("healthy")
        ? "Healthy Eating"
        : text.includes("quick")
        ? "Quick Meals"
        : text.includes("family")
        ? "Family Friendly"
        : prev.goal,

      // level
      skillLevel: text.includes("beginner")
        ? "Beginner"
        : text.includes("intermediate")
        ? "Intermediate"
        : text.includes("expert")
        ? "Advanced"
        : text.includes("advanced")
        ? "Advanced"
        : prev.skillLevel,

      // Cuisine
      cuisine: text.includes("asian")
        ? "Asian"
        : text.includes("italian")
        ? "Italian"
        : text.includes("mexican")
        ? "Mexican"
        : text.includes("chinese")
        ? "Chinese"
        : text.includes("indian")
        ? "Indian"
        : prev.cuisine,

      // Budget
      budgetLevel:
        text.includes("cheap") || text.includes("low budget")
          ? "Low"
          : text.includes("medium") || text.includes("medium budget")
          ? "Medium"
          : text.includes("high") || text.includes("high budget")
          ? "High"
          : prev.budgetLevel,

      // allergies
      allergies: [
        ...new Set([
          ...prev.allergies,
          ...(text.includes("peanuts") ? ["Peanuts"] : []),
          ...(text.includes("fish") ? ["Fish"] : []),
          ...(text.includes("dairy") ? ["Dairy"] : []),
          ...(text.includes("soy") ? ["Soy"] : []),
          ...(text.includes("wheat") ? ["wheat"] : []),
          ...(text.includes("shellfish") ? ["Shellfish"] : []),
          ...(text.includes("eggs") ? ["Eggs"] : []),
        ]),
      ],
      // Dietary Preferences
      dietaryPreferences: [
        ...new Set([
          ...prev.dietaryPreferences,
          ...(text.includes("vegetarian") ? ["Vegetarian"] : []),
          ...(text.includes("vegan") ? ["Vegan"] : []),
          ...(text.includes("keto") ? ["Keto"] : []),
          ...(text.includes("paleo") ? ["Paleo"] : []),
          ...(text.includes("mediterranean") ? ["Mediterranean"] : []),
          ...(text.includes("gluten-free") ? ["Gluten-Free"] : []),
          ...(text.includes("dairy-free") ? ["Dairy-Free"] : []),
        ]),
      ],
    }));
  }, [voiceText]);
  // Generate plan handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGeneratingProgress(0);

    const progressInterval = setInterval(() => {
      setGeneratingProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 500);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        (user?.token ? user.token : null);

      const requestBody = {
        province: form.province,
        goal: form.goal,
        cuisine: form.cuisine,
        budget_level: form.budgetLevel,
        portions: form.portions,
        meals_per_day: form.mealsPerDay,
        days_count: form.days_count,
        likes: form.likes,
        dislikes: form.dislikes,
        cooking_method: form.cookingMethod,
        max_cooking_time: form.maxCookingTime,
        skill_level: form.skillLevel,
        dietary_preferences: form.dietaryPreferences,
        allergies: form.allergies,
      };

      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success === false) {
        clearInterval(progressInterval);
        setLoading(false);

        // Always show the error toast
        toast.error(data.error || "Unable to generate plan");

        // If it's a limit issue, show the upgrade warning
        if (data.limitReached) {
          setFreeLimitReached(true);
        }

        return; // don't generate anything
      }

      // If we get here, success must be true
      setPlan(data.plan);
      clearInterval(progressInterval);
      setGeneratingProgress(100);

      setPlan(data.plan);
      clearInterval(progressInterval);
      setGeneratingProgress(100);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Generate error:", err);
      toast.error(err.message || "Failed to generate plan");
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setGeneratingProgress(0), 1000);
    }
  };
  // Change form handler
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = e.target.checked;
      if (name === "dietaryPreferences" || name === "allergies") {
        setForm((prev) => ({
          ...prev,
          [name]: checked
            ? [...prev[name], value]
            : prev[name].filter((item) => item !== value),
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "number" ? parseInt(value) : value,
      }));
    }
  };
  // Save plan
  const savePlan = async () => {
    try {
      if (!plan) {
        toast.warning("No plan to save!");
        return;
      }

      // Get user ID
      const userId = user?.id || user?._id;

      if (!user || !userId) {
        toast.warning("Please login to save plans!");
        return;
      }

      // Prepare request body - INCLUDE SOURCE FIELD
      const requestBody = {
        planData: {
          ...plan,
          title: plan.title || `${plan.inputs?.goal || "Weekly"} Meal Plan`,
          days: plan.days || [],
          inputs: plan.inputs || {},
          swaps: plan.swaps || { allowed: 1, used: 0, remaining: 1 },
          tier: plan.tier || "free",
          source: plan.source || "openai", // ← CRITICAL: Include source
          userId: plan.userId || userId,
          userEmail: plan.userEmail || user.email,
          swapsUsed: plan.swaps?.used || 0,
          swapsAllowed: plan.swaps?.allowed || 1,
          // Remove temporary ID if it exists
          ...(plan.id && plan.id.startsWith("temp_") && { tempId: plan.id }),
        },
        userId: userId,
        userEmail: user.email,
        userTier: user.tier || "free",
        source: plan.source || "openai", 
      };

      const response = await fetch(`/api/plans/${plan.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Plan saved successfully!");

        // Update plan state with database data
        setPlan({
          ...plan,
          id: result.plan?.id || plan.id, // Use real MongoDB ID if returned
          title: result.plan?.title || plan.title,
          isSaved: true,
          needsUpdate: false,
          expiresAt: result.plan?.expiresAt,
          swaps: {
            allowed: result.plan?.swapsAllowed || plan.swaps?.allowed || 1,
            used: result.plan?.swapsUsed || plan.swaps?.used || 0,
            remaining:
              (result.plan?.swapsAllowed || plan.swaps?.allowed || 1) -
              (result.plan?.swapsUsed || plan.swaps?.used || 0),
          },
          // Keep all other data
          days: plan.days,
          inputs: plan.inputs,
          tier: plan.tier,
          source: plan.source, // Preserve the source
        });

        return result;
      } else {
        console.error("Save failed:", result);

        // More specific error messages
        if (
          result.error?.includes("source") ||
          result.error?.includes("enum")
        ) {
          toast.error("Database schema needs update. Please contact support.");
        } else {
          toast.error(result.error || "Failed to save plan");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error: " + error.message);
    }
  };
  // Generate another plan
  const generateAnother = () => {
    setPlan(null);
    setError("");
    setForm({
      province: "Ontario",
      cuisine: "",
      goal: "",
      budgetLevel: "Medium",
      portions: 2,
      mealsPerDay: 3,
      likes: "",
      dislikes: "",
      cookingMethod: "",
      maxCookingTime: 30,
      skillLevel: "Beginner",
      dietaryPreferences: [],
      allergies: [],
      days_count: 7,
    });
  };
  // Generate grocery list
  const generateGroceryList = async () => {
    try {
      if (!plan || !plan.id) {
        toast.error("No plan available to generate grocery list");
        return;
      }

      // Check if user is logged in
      if (!user) {
        toast.error("Please login to generate grocery lists");
        return;
      }

      // Check user tier
      if (user.tier === "free") {
        toast.error("Upgrade to Plus or Premium to generate grocery lists");
        return;
      }

      // Check if plan is saved 
      if (!plan.isSaved && plan.id.startsWith("temp_")) {
        toast.warning(
          <div>
            <p className="font-medium">Please save the plan first!</p>
            <p className="text-sm mt-1">
              Click Save Plan to save your meal plan, then generate grocery
              list.
            </p>
          </div>,
          {
            autoClose: 5000,
            closeButton: true,
            closeOnClick: true,
          }
        );
        return;
      }

      setLoading(true);

      // Get authentication token
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        (user?.token ? user.token : null);

      if (!token) {
        toast.error("Authentication token missing. Please login again.");
        return;
      }

      const requestBody = {
        planId: plan.id,
      };
      const response = await fetch("/api/groceryLists/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned non-JSON: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (response.ok) {
        toast.success("Grocery list generated successfully!");

        // Store in localStorage
        localStorage.setItem(
          "lastGroceryList",
          JSON.stringify(data.groceryList)
        );

        // Open grocery list page
        window.location.href = `/${locale}/grocery-list/${data.groceryList.id}`;

        return data.groceryList;
      } else {
        // Handle specific errors
        if (data.planNotSaved) {
          toast.error(
            "Please save the plan first before generating grocery list"
          );
        } else if (data.requiresUpgrade) {
          toast.error("Upgrade required for grocery list feature");
        } else if (response.status === 401) {
          toast.error("Authentication failed. Please login again.");
        } else {
          toast.error(data.error || "Failed to generate grocery list");
        }
      }
    } catch (error) {
      console.error("Grocery list error:", error);

      // Better error message
      if (error.message.includes("non-JSON")) {
        toast.error("Server error. Please check if the API endpoint exists.");
      } else {
        toast.error("Error generating grocery list: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  // Update your Instacart function
  const orderOnInstacart = async () => {
    try {
      if (!plan || !plan.id) {
        toast.error("No plan available");
        return;
      }

      if (user.tier === "free") {
        toast.error(
          "Instacart integration is only available for Plus and Premium users"
        );
        return;
      }

      // First generate grocery list if not already done
      const groceryList = await generateGroceryList();

      if (groceryList && groceryList.instacartDeepLink) {
        // Open Instacart in new tab
        window.open(groceryList.instacartDeepLink, "_blank");
      } else {
        toast.error("Could not generate Instacart link");
      }
    } catch (error) {
      toast.error("Error connecting to Instacart: " + error.message);
    }
  };
  // swap meal
  const swapMeal = async (planId, mealIndex, dayIndex) => {
    try {
      setIsSwapping(true);

      // Check if user is logged in
      if (!user) {
        toast.error("Please login to swap meals");
        return null;
      }

      // Prepare swap data
      const swapData = {
        dayIndex,
        mealIndex,
        userId: user?.id || user?._id,
        userEmail: user?.email,
        userTier: user?.tier || "free",
        planData: plan, // Send current plan data
      };


      const response = await fetch(`/api/plans/${planId}/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(swapData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);

        // Update plan with swapped meal
        setPlan((prev) => {
          const updatedDays = [...prev.days];

          // Update the specific meal
          updatedDays[dayIndex].meals[mealIndex] = data.newMeal;

          const updatedPlan = {
            ...prev,
            days: updatedDays,
            swaps: data.swaps || prev.swaps,
            userTier: data.userTier || prev.tier,
            // If plan was saved, mark as needing update
            needsUpdate: prev.isSaved ? true : false,
            // Update plan data if it's a saved plan
            ...(data.updatedPlanData && { ...data.updatedPlanData }),
          };

          // console.log("Plan updated after swap:", updatedPlan);
          return updatedPlan;
        });

        return data;
      } else {
        toast.error(data.error || "Failed to swap meal");
        return null;
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast.error("Error swapping meal: " + error.message);
      return null;
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-[1500px]">
        <p className="text-center text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
          {t("title")}
        </p>

        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
        {/* for free users */}
        {freeLimitReached && (
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 font-medium">
                You have reached your free plan limit (1 plan per month).
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Upgrade to <span className="font-semibold">Plus</span> for 6
                plans/month, or <span className="font-semibold">Premium</span>{" "}
                for unlimited plans.
              </p>
              <button
                onClick={() => (window.location.href = "/#pricing")}
                className="mt-2 bg-[#8cc63c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#7ab32f] transition"
              >
                View Plans & Pricing
              </button>
            </div>
          </div>
        )}
        {/* Form */}
        {!plan ? (
          <div className="max-w-6xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 bg-white rounded-2xl shadow-lg p-6 md:p-6"
            >
              {/* Province & Goal */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.province`)}
                  </label>
                  <div className="relative">
                    <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 "
                  >
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.goal`)}
                  </label>
                  <select
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="">{t(`form.selectGoal`)}</option>
                    {GOALS.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cuisine & Budget */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.cuisine`)}
                  </label>
                  <input
                    type="text"
                    name="cuisine"
                    value={form.cuisine}
                    onChange={handleChange}
                    placeholder={t(`form.cuisinePlaceholder`)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.budgetLevel`)}
                  </label>
                  <select
                    name="budgetLevel"
                    value={form.budgetLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    {BUDGET_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Portions, Meals, Time */}
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.portions`)}
                  </label>
                  <input
                    type="number"
                    name="portions"
                    min="1"
                    max="10"
                    value={form.portions}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.mealsPerDay`)}
                  </label>
                  <input
                    type="number"
                    name="mealsPerDay"
                    min="1"
                    max="5"
                    value={form.mealsPerDay}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Days <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="days_count"
                    value={form.days_count}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        days_count: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    disabled={loading}
                  >
                    {/* Free users: only 3 days */}
                    {!user || user?.tier === "free" ? (
                      <>
                        <option value="3">3 days</option>
                        {!user && (
                          <option value="7" disabled className="text-gray-400">
                            7 days (Weekly) - Login required
                          </option>
                        )}
                      </>
                    ) : (
                      /* Paid users: all options */
                      <>
                        <option value="3">3 days</option>
                        <option value="4">4 days</option>
                        <option value="5">5 days</option>
                        <option value="6">6 days</option>
                        <option value="7">7 days (Weekly)</option>
                      </>
                    )}
                  </select>

                  {/* Help text showing user's tier limits */}
                  <p className="text-xs text-gray-500 mt-1">
                    {!user
                      ? "Login to access 7-day plans"
                      : user?.tier === "free"
                      ? "Free tier: 3-day plan only"
                      : `Premium tier: ${
                          user?.tier === "tier2" ? "Up to 7" : "Up to 7"
                        } day plans available`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.maxCookingTime`)} (minutes)
                  </label>
                  <input
                    type="number"
                    name="maxCookingTime"
                    min="5"
                    max="180"
                    value={form.maxCookingTime}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
              </div>

              {/* Likes & Dislikes */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.likes`)}
                  </label>
                  <input
                    type="text"
                    name="likes"
                    value={form.likes}
                    onChange={handleChange}
                    placeholder={t(`form.likesPlaceholder`)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.dislikes`)}
                  </label>
                  <input
                    type="text"
                    name="dislikes"
                    value={form.dislikes}
                    onChange={handleChange}
                    placeholder={t(`form.dislikesPlaceholder`)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
              </div>

              {/* Cooking Method & Skill Level */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.cookingMethod`)}
                  </label>
                  <input
                    type="text"
                    name="cookingMethod"
                    value={form.cookingMethod}
                    onChange={handleChange}
                    placeholder="e.g., bake, grill, stir-fry"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t(`form.skillLevel`)}
                  </label>
                  <select
                    name="skillLevel"
                    value={form.skillLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t(`form.dietaryPreferences`)}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIETARY_PREFERENCES.map((pref) => (
                    <label
                      key={pref}
                      className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        name="dietaryPreferences"
                        value={pref}
                        checked={form.dietaryPreferences.includes(pref)}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t(`form.allergies`)}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ALLERGIES.map((allergy) => (
                    <label
                      key={allergy}
                      className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        name="allergies"
                        value={allergy}
                        checked={form.allergies.includes(allergy)}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{allergy}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8cc63c] hover:bg-[#7ab32f] text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating {form.days_count}-Day Plan... (
                      {generatingProgress}%)
                    </div>
                  ) : (
                    t("generateButton")
                  )}
                </button>

                {/* Estimated Time */}
                {loading && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Estimated time:{" "}
                    {form.days_count <= 3
                      ? "30-60 seconds"
                      : form.days_count <= 5
                      ? "1-2 minutes"
                      : "2-3 minutes"}
                  </p>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* Plan Display */
          <div className="max-w-[1500px] mt-6 mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-6">
              {/* Plan Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {plan.title}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {plan.days?.length || 7}-Day Plan •{t("plan.generatedFor")}{" "}
                    <span className="font-semibold text-[#8cc63c]">
                      {plan.swaps.remaining} of {plan.swaps.allowed} swaps
                      available
                    </span>{" "}
                    •{" "}
                    {plan.tier === "free"
                      ? "Free Plan"
                      : `${
                          plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)
                        } Tier`}
                  </p>
                </div>
                <div
                  className="btn cursor-pointer text-[#8cc63c] hover:text-green-700 "
                  onClick={generateAnother}
                >
                  Generate Another Plan
                </div>
              </div>

              {/* Meal Plan Days */}
              <div className="space-y-6">
                {plan.days?.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center mb-6">
                      <div className="bg-green-100 text-[#8cc63c] font-bold text-lg w-10 h-10 flex items-center justify-center rounded-full mr-4">
                        {dayIndex + 1}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Day {dayIndex + 1}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-4">
                      {day.meals?.map((meal, mealIndex) => (
                        <div
                          key={mealIndex}
                          className="bg-gray-50 rounded-xl md:p-3 p-2 hover:bg-white hover:shadow-md transition flex flex-col md:h-[400px] h-[280px]"
                        >
                          {/* Header*/}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center min-w-0 flex-1">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold mr-2 shrink-0 ${
                                  meal.mealType === "breakfast"
                                    ? "bg-green-100 text-green-800"
                                    : meal.mealType === "lunch"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : meal.mealType === "dinner"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {meal.mealType.charAt(0).toUpperCase()}
                              </span>
                              <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
                                {meal.recipeName}
                              </h4>
                            </div>
                            <div className="text-sm  text-gray-500 shrink-0 ml-2">
                              {meal.cookingTime} min
                            </div>
                          </div>
                          {meal.recipeSource === "spoonacular" && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center shrink-0 ml-2">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Verified
                            </span>
                          )}

                          <div className="text-sm text-gray-500 shrink-0 ml-2">
                            {meal.cookingTime} min
                          </div>
                          {/* Scrollable Content Area - Mobile optimized */}
                          <div className="flex-1 overflow-y-auto pr-1 meal-scroll">
                            {/* Ingredients - Mobile friendly */}
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Ingredients ({meal.ingredients?.length || 0}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {meal.ingredients?.map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-white border border-gray-200 px-2 py-1 rounded text-sm whitespace-normal wrap-break-words"
                                    title={`${ing.quantity} ${ing.unit} ${ing.name}`}
                                  >
                                    {ing.quantity} {ing.unit} {ing.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Instructions - Mobile optimized */}
                            {meal.instructions &&
                              meal.instructions.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Instructions:
                                  </p>
                                  <ol className="space-y-1">
                                    {meal.instructions.map((step, idx) => (
                                      <li
                                        key={idx}
                                        className="text-sm text-gray-600 flex"
                                      >
                                        <span className="font-semibold text-[#4a9fd8] mr-1 shrink-0">
                                          {idx + 1}.
                                        </span>
                                        <span className="flex-1">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                          </div>

                          {/* Swap Button */}
                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={async () => {
                                if (plan.swaps.remaining <= 0) {
                                  toast.error(`No swaps remaining!`);
                                  return;
                                }
                                setIsSwapping(true);
                                await swapMeal(plan.id, mealIndex, dayIndex);
                              }}
                              disabled={plan.swaps.remaining <= 0 || isSwapping}
                              className={`w-full text-sm font-medium py-1.5 sm:py-1 rounded transition-colors duration-200 ${
                                plan.swaps.remaining <= 0 || isSwapping
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-[#4a9fd8] hover:bg-[#20a1f7] text-white"
                              }`}
                            >
                              {isSwapping ? (
                                <span className="flex items-center justify-center">
                                  Swapping...
                                </span>
                              ) : plan.swaps.remaining <= 0 ? (
                                "No Swaps Left"
                              ) : (
                                "Swap This Meal"
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="max-w-5xl mx-auto pt-8 border-t border-gray-200">
                {plan.isSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <p className="text-green-800">
                      This plan is saved to your account. You can now generate
                      grocery lists.
                    </p>
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    onClick={savePlan}
                    disabled={!plan || (plan.isSaved && !plan.needsUpdate)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex-1 ${
                      !plan || (plan.isSaved && !plan.needsUpdate)
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {!plan
                      ? "Save Plan"
                      : plan.needsUpdate
                      ? "Update Plan"
                      : plan.isSaved
                      ? "Plan Saved"
                      : "Save Plan"}
                  </button>
                  <button
                    onClick={() => {
                      if (plan.requiresAccount) {
                        toast.warning(
                          "Please create an account to generate grocery list!"
                        );
                      } else {
                        generateGroceryList(plan.id);
                      }
                    }}
                    className="flex-1 bg-green-600  text-white font-semibold py-4 rounded-xl hover:bg-green-400 hover:text-black transition flex items-center justify-center"
                  >
                    Generate Grocery List
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
