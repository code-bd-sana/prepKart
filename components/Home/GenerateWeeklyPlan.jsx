"use client";

import { useState } from "react";
import {
  PROVINCES,
  GOALS,
  BUDGET_LEVELS,
  SKILL_LEVELS,
  DIETARY_PREFERENCES,
  ALLERGIES,
} from "@/lib/types";
import { useSelector } from "react-redux";

export default function GenerateWeeklyPlan() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const { user } = useSelector((state) => state.auth);

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
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Save Plan
  const savePlan = async () => {
    try {
      if (!plan) {
        alert("No plan to save");
        return;
      }

      // Get user ID
      const userId = user?.id || user?._id;

      if (!user || !userId) {
        alert("Please login to save plans");
        return;
      }

      // Log what we're sending
      const requestBody = {
        planData: plan,
        userId: userId,
        userEmail: user.email,
        userTier: user.tier || "free",
      };

      const response = await fetch(`/api/plans/${plan.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        //   console.log('Plan saved response:', result);
        alert("Plan saved for 7 days!");

        if (result.plan?.id) {
          setPlan({
            ...plan,
            id: result.plan.id,
            isSaved: true,
            expiresAt: result.plan.expiresAt,
          });
        }

        return result;
      } else {
        console.error("Failed to save:", result);
        alert(result.message || "Failed to save plan");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error: " + error.message);
    }
  };
  // Generate Another Plan Button
  const generateAnother = () => {
    setPlan(null); // Clear current plan to show form again
  };

  const generateGroceryList = async (planId) => {
    try {
      const response = await fetch(`/api/grocerylists/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Grocery list generated!");
        // You can redirect to grocery list page
        // window.location.href = `/grocery-list/${data.listId}`;
      } else {
        alert(data.error || "Failed to generate grocery list");
      }
    } catch (error) {
      alert("Error generating grocery list");
    }
  };

  const orderOnInstacart = async (planId) => {
    try {
      const response = await fetch(`/api/grocerylists/${planId}/instacart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.instacartLink) {
        // Open Instacart link in new tab
        window.open(data.instacartLink, "_blank");
      } else {
        alert(data.error || "Failed to generate Instacart link");
      }
    } catch (error) {
      alert("Error connecting to Instacart");
    }
  };

  const swapMeal = async (planId, mealIndex, dayIndex) => {
    try {
      const response = await fetch(`/api/plans/${planId}/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          dayIndex,
          mealIndex,
          planData: plan,
          userId: user?.id,
          userEmail: user?.email,
          userTier: user?.tier || "free",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);

        setPlan((prev) => {
          const updatedDays = [...prev.days];
          updatedDays[dayIndex].meals[mealIndex] = data.newMeal;

          return {
            ...prev,
            days: updatedDays,
            swaps: data.swaps,
            tier: data.userTier || prev.tier,
          };
        });

        return data;
      } else {
        alert(data.error || "Failed to swap meal");
        return null;
      }
    } catch (error) {
      alert("Error swapping meal");
      return null;
    }
  };

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-[1500px]">
        <p className="text-center text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
          Generate My Weekly Plan
        </p>

        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
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
                    Province *
                  </label>
                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Goal *
                  </label>
                  <select
                    name="goal"
                    value={form.goal}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="">Select your goal</option>
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
                    Cuisine Preferences
                  </label>
                  <input
                    type="text"
                    name="cuisine"
                    value={form.cuisine}
                    onChange={handleChange}
                    placeholder="e.g., Italian, Mexican, Asian"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Level
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
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portions
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
                    Meals per Day
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Cooking Time (minutes)
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
                    Foods You Like
                  </label>
                  <input
                    type="text"
                    name="likes"
                    value={form.likes}
                    onChange={handleChange}
                    placeholder="e.g., chicken, pasta, vegetables"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foods You Dislike
                  </label>
                  <input
                    type="text"
                    name="dislikes"
                    value={form.dislikes}
                    onChange={handleChange}
                    placeholder="e.g., mushrooms, olives, spicy food"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2"
                  />
                </div>
              </div>

              {/* Cooking Method & Skill Level */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Cooking Methods
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
                    Cooking Skill Level
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
                  Dietary Preferences
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
                  Allergies
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
                  className="w-full bg-[#8cc63c] hover:bg-[#7ab32f]  text-white font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      Generating Your Plan...
                    </div>
                  ) : (
                    "Generate My Weekly Meal Plan"
                  )}
                </button>
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
                    Generated just for you • {plan.swaps.remaining} swaps
                    available
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  {plan.requiresAccount && (
                      <div className="mt-2">
                        <button
                          onClick={() => (window.location.href = "/signup")}
                          className="text-[#4a9fd8] font-medium hover:text-[#1f88ce] cursor-pointer"
                        >
                          Sign Up for Free
                        </button>
                        <span className="mx-2">|</span>
                        <button
                          onClick={generateAnother}
                          className="text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                          Generate Another Plan
                        </button>
                    </div>
                  )}
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

                    <div className="space-y-6 grid grid-cols-1 md:grid-cols-3 gap-x-3">
                      {day.meals?.map((meal, mealIndex) => (
                        <div
                          key={mealIndex}
                          className="bg-gray-50 rounded-xl p-2 hover:bg-white hover:shadow-md transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div className="flex items-center mb-3 md:mb-0">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mr-3 ${
                                  meal.mealType === "breakfast"
                                    ? "bg-green-100 text-green-800"
                                    : meal.mealType === "lunch"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : meal.mealType === "dinner"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {meal.mealType}
                              </span>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {meal.recipeName}
                              </h4>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <span>{meal.cookingTime} minutes</span>
                            </div>
                          </div>

                          {/* Ingredients */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              Ingredients:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {meal.ingredients?.map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm"
                                >
                                  {ing.quantity} {ing.unit} {ing.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Instructions */}
                          {meal.instructions && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                Instructions:
                              </p>
                              <ol className="space-y-2 pl-5">
                                {meal.instructions.map((step, idx) => (
                                  <li key={idx} className="text-gray-600 flex">
                                    <span className="font-semibold text-[#4a9fd8] mr-2">
                                      {idx + 1}.
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Swap Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                if (plan.swaps.remaining <= 0) {
                                  alert("No swaps remaining for this plan!");
                                } else {
                                  swapMeal(plan.id, mealIndex, dayIndex);
                                }
                              }}
                              className="text-[#4a9fd8] hover:text-[#20a1f7] font-medium flex items-center"
                            >
                              Swap This Meal
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
                    disabled={!plan || plan.isSaved}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all flex-1 ${
                      !plan || plan.isSaved
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-primary hover:bg-primary-dark text-black hover:text-white bg-green-600 hover:bg-green-800"
                    }`}
                  >
                    {plan?.isSaved ? "Plan Saved" : "Save Plan"}
                  </button>
                  <button
                    onClick={() => {
                      if (plan.requiresAccount) {
                        alert(
                          "Please create an account to generate grocery list!"
                        );
                      } else {
                        generateGroceryList(plan.id);
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-800 font-semibold py-4 rounded-xl hover:bg-gray-200 transition flex items-center justify-center"
                  >
                    Generate Grocery List
                  </button>
                  <button
                    onClick={() => {
                      if (plan.requiresAccount) {
                        alert("Please create an account to use Instacart!");
                      } else if (plan.tier === "free") {
                        alert(
                          "Upgrade to Tier 2 or Tier 3 to unlock Instacart integration!"
                        );
                      } else {
                        orderOnInstacart(plan.id);
                      }
                    }}
                    className="flex-1 bg-green-500 text-white font-semibold py-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center"
                  >
                    Order on Instacart
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
