"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FiX, FiLoader, FiCheck, FiArrowRight } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function QuickPlanModal({ isOpen, onClose, planType, locale }) {
  const { user } = useSelector((state) => state.auth);
  const t = useTranslations("quickPlanModal");
  const modalRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("3day"); // "3day" or "7day"

  const userTier = user?.tier || "free";

  // Generate initial 3-day plan
  useEffect(() => {
    if (isOpen && planType) {
      setViewMode("3day");
      generatePlan(3);
    }
  }, [isOpen, planType]);

  const generatePlan = async (daysCount) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-quick-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          userTier,
          locale,
          daysCount,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed");

      setPlanData(data);
      if (daysCount === 7) setViewMode("7day");
    } catch (err) {
      console.error("Error:", err);
      setError(`Error: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGet7DayPlan = () => {
    generatePlan(7);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {viewMode === "7day" ? "7-Day Plan" : "Quick Preview"}
            </h2>
            <p className="text-gray-600 mt-1">
              {viewMode === "7day" ? "Complete weekly plan" : "3-day preview"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <FiLoader className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600">
                {viewMode === "7day"
                  ? "Generating 7-Day Plan..."
                  : "Generating preview..."}
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-red-900 mb-2">Error</h4>
              <p className="text-red-700 mb-2">{error}</p>
              <button
                onClick={() => generatePlan(viewMode === "7day" ? 7 : 3)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && planData && (
            <div>
              {/* PLAN DISPLAY */}
              <div className="mb-8">
                {viewMode === "3day" ? (
                  // 3-DAY PREVIEW - ORIGINAL STYLE
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {t("yourQuickPlan")}
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
                          onClick={() => generatePlan(3)}
                          className="mt-2 text-sm text-yellow-700 hover:text-yellow-900"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // 7-DAY FULL PLAN - NEW STYLE
                  <div>
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        7-Day Plan Generated
                      </h3>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                      {planData.days?.map((day) => (
                        <div
                          key={day.dayIndex}
                          className="border rounded-xl p-4"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">
                            {day.dayName} (Day {day.dayIndex})
                          </h4>
                          {day.meals?.map((meal, idx) => (
                            <div
                              key={idx}
                              className="border-b pb-3 last:border-0"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {meal.recipeName}
                                  </p>
                                  <p className="text-sm text-gray-600 capitalize">
                                    {meal.mealType}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {meal.cookingTime} min
                                </span>
                              </div>
                              {meal.ingredients?.slice(0, 2).map((ing, i) => (
                                <p
                                  key={i}
                                  className="text-sm text-gray-500 mt-1"
                                >
                                  {ing.name}: {ing.quantity} {ing.unit}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              {viewMode === "3day" ? (
                // SHOW "GET 7-DAY PLAN" BUTTON - ORIGINAL STYLE
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-6">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {t("fullPlanTitle")}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {t("fullPlanDescription")}
                    </p>
                  </div>
                  <button
                    onClick={handleGet7DayPlan}
                    className="cursor-pointer text-green-600 bg-primary px-4 py-2 rounded-lg font-medium hover:bg-primary-dark flex items-center gap-2"
                  >
                    Get 7-Day Plan
                    <FiCheck className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // SHOW "GO TO GENERATE WEEKLY PLAN" BUTTON
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                    <p className="text-blue-700 mb-4 text-xs">
                      Go to ‘Generate Weekly Plan’ on the home banner’s modal
                      for complete meal planning with grocery lists.
                    </p>
                  </div>
                </div>
              )}

              {/* UPGRADE PROMPT */}
              {userTier === "free" && viewMode === "3day" && (
                <div className="mt-4 flex justify-between bg-blue-50 border border-green-200 rounded-xl p-3">
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-green-900 mb-2">
                      {t("upgradeTitle")}
                    </h4>
                    <p className="text-green-800 mb-4">
                      {t("upgradeDescription")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = "/#pricing";
                    }}
                    className="bg-green-600 text-white px-2 py-1 rounded-lg font-medium hover:bg-green-700"
                  >
                    {t("upgradeButton")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
