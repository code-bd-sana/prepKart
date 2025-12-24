"use client";

import { useState, useEffect } from "react";
import { FiX, FiLoader, FiCheck } from "react-icons/fi";
import { useSelector } from "react-redux";

export default function QuickPlanModal({ isOpen, onClose, planType, locale }) {
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [error, setError] = useState(null);

  // Get user tier
  const userTier = user?.tier || "free";
  const isFreeUser = userTier === "free";

  // Translations
  const t = {
    title: "Your Quick Plan",
    subtitle: `Generated for ${userTier} tier`,
    generating: "Creating your smart meal plan...",
    retry: "Try again",
    yourQuickPlan: "Here's your 3-day plan",
    upgradeTitle: "Upgrade for More Features",
    upgradeDescription:
      "Get full 7-day plans, grocery lists, and premium recipes",
    upgradeButton: "Upgrade Now",
    fullPlanTitle: "Want More Accuracy?",
    fullPlanDescription: "Generate a full 7-day plan with all your preferences",
    fullPlanButton: "Generate Full Plan",
  };

  // Define generateQuickPlan function
  const generateQuickPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const requestBody = {
        planType,
        userTier,
        locale,
      };

      const response = await fetch("/api/generate-quick-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to generate plan (${response.status})`
        );
      }

      setPlanData(data);
    } catch (err) {
      console.error(" Quick plan error:", err);
      setError(`Error: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && planType) {
      generateQuickPlan();
    } else {
      setPlanData(null);
      setError(null);
    }
  }, [isOpen, planType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <FiLoader className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">{t.generating}</p>
              <p className="text-sm text-gray-500 mt-2">
                Generating {planType} plan for {userTier} tier...
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-red-900 mb-2">
                Error Generating Plan
              </h4>
              <p className="text-red-700 mb-2">{error}</p>
              <p className="text-sm text-red-600 mb-4">
                Check browser console for details (F12 → Console)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={generateQuickPlan}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  {t.retry}
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && !planData && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">Plan not generated yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Click below to generate your {planType} plan
              </p>
              <button
                onClick={generateQuickPlan}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark"
              >
                Generate Plan
              </button>
            </div>
          )}

          {planData && (
            <div>
              {/* Plan Preview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  {t.yourQuickPlan}
                </h3>

                {planData.days && planData.days.length > 0 ? (
                  planData.days.slice(0, 1).map((day) => (
                    <div key={day.dayIndex} className="space-y-4">
                      <h4 className="font-medium text-gray-900">
                        {day.dayName}
                      </h4>
                      {day.meals && day.meals.length > 0 ? (
                        day.meals.slice(0, 3).map((meal, idx) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {meal.recipeName || "Unnamed Recipe"}
                                </p>
                                <p className="text-sm text-gray-600 capitalize">
                                  {meal.mealType || "meal"}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {meal.cookingTime || 25} min
                              </span>
                            </div>
                            {/* Show first ingredient */}
                            {meal.ingredients &&
                              meal.ingredients.length > 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                  {meal.ingredients[0].name}:{" "}
                                  {meal.ingredients[0].quantity}{" "}
                                  {meal.ingredients[0].unit}
                                </p>
                              )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No meals generated</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      Plan generation returned empty data
                    </p>
                    <button
                      onClick={generateQuickPlan}
                      className="mt-2 text-sm text-yellow-700 hover:text-yellow-900"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Upgrade Prompt */}
              {isFreeUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    {t.upgradeTitle}
                  </h4>
                  <p className="text-blue-800 mb-4">{t.upgradeDescription}</p>
                  <button
                    onClick={() => {
                      onClose();
                      // Navigate to pricing
                      window.location.href = "/#pricing";
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    {t.upgradeButton}
                  </button>
                </div>
              )}

              {/* Full Plan CTA */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {t.fullPlanTitle}
                </h4>
                <p className="text-gray-600 mb-4">{t.fullPlanDescription}</p>
                <button
                  onClick={() => {
                    onClose();
                    // Open full plan modal
                    // You'll need to pass this to parent
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark flex items-center gap-2"
                >
                  {t.fullPlanButton}
                  <FiCheck className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
