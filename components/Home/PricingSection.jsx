"use client";

import { fetchUserData } from "@/store/slices/authSlice";
import { Check, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";

const plans = [
  {
    name: "FREE PLAN",
    tagline: "Try Prepcart with the basics — no commitment.",
    price: "Free",
    badge: "Try Now",
    color: "#4a9fd8",
    buttonColor: "bg-[#4a9fd8] hover:bg-[#3a8fc8] text-white",
    features: {
      included: [
        "1 meal plan per week",
        "1 grocery list",
        "Limited quick plans",
        "Limited recipes",
        "1 Instacart-integrated list",
        "Basic dashboard view",
      ],
      notIncluded: [
        "No saving meal plans",
        "No saving grocery lists",
        "No budget planner",
        "No macros/nutrition breakdown",
      ],
    },
    description: "Best for: First-time users",
    buttonText: "Get Started Free",
  },
  {
    name: "PLUS PLAN",
    tagline: "More flexibility. More control. Zero stress.",
    price: "$4.99",
    period: "/ month",
    oldPrice: "$7.99",
    badge: "Most Popular",
    color: "#8cc63c",
    buttonColor: "bg-[#8cc63c] hover:bg-[#7cb52c] text-white",
    popular: true,
    stripeTier: "tier2", // for Stripe
    features: {
      included: [
        "4 meal plans per week",
        "4 Instacart-integrated lists",
        "Save & print plans",
        "Macros & nutrition insights",
        "New weekly recipes",
        "Save favorite meals",
        "Full Dashboard Access",
        "Track budget",
        "Organize weekly plans",
      ],
      notIncluded: [
        "Limited budget organizer",
        "No priority support",
        "No early feature access",
      ],
    },
    description: "Best for: Busy individuals & families",
    buttonText: "Start Plus Plan",
  },
  {
    name: "PREMIUM PLAN",
    tagline: "The full Prepcart experience — effortless and personalized.",
    price: "$9.99",
    period: "/ month",
    oldPrice: "$12.99",
    badge: "Unlimited Access",
    color: "#1E1E1E",
    buttonColor: "bg-[#1E1E1E] hover:bg-[#0E0E0E] text-white",
    stripeTier: "tier3", // for Stripe
    features: {
      included: [
        "Unlimited meal plans",
        "Unlimited Instacart lists",
        "All recipes unlocked",
        "Early access to new features",
        "Priority support",
        "Smart reminders & alerts",
        "Full Dashboard Access",
        "Save everything",
        "Track spending",
        "Build long-term meal routines",
      ],
      notIncluded: [],
    },
    description:
      "Best for: Meal preppers, health-focused users, and power planners",
    buttonText: "Go Premium",
  },
];

export default function PricingSection() {
  const { user, loading } = useSelector((state) => state.auth);
  const [processing, setProcessing] = useState(false);
  const dispatch = useDispatch();
  const [cancelling, setCancelling] = useState(false);

  const isLoggedIn = Boolean(user);
  const userTier = user?.tier;

  const handleCancel = async (plan) => {
    const message =
      plan.name === "FREE PLAN"
        ? `Are you sure you want to cancel your ${
            userTier === "tier2" ? "Plus" : "Premium"
          } plan and switch to Free?`
        : `Are you sure you want to cancel your ${plan.name}?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setCancelling(true);

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${plan.name} cancelled! You're now on Free plan.`);

        // Refresh user data
        dispatch(fetchUserData());
      } else {
        alert("Cancellation failed: " + data.error);
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  // Handle URL hash changes for payment status
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes("#pricing")) {
        const params = new URLSearchParams(hash.split("?")[1] || "");
        const paramsObj = Object.fromEntries(params.entries());

        // Show error alert
        if (paramsObj.error) {
          alert("Payment error: " + decodeURIComponent(paramsObj.error));
          window.history.replaceState({}, "", "/#pricing");
        }

        // Handle success
        if (paramsObj.payment === "success") {
          window.history.replaceState({}, "", "/#pricing");
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [dispatch]);

  const handlePayment = async (plan) => {
    if (!plan.stripeTier) {
      // Free plan clicked
      if (!isLoggedIn) {
        window.location.href = "/login";
        return;
      }

      // If user is on a paid plan (tier2 or tier3) and clicks Free plan, it means they want to cancel/downgrade
      if (userTier !== "free") {
        // Call cancel subscription function
        handleCancel(plan);
        return;
      }

      // If already on free plan, go to dashboard
      window.location.href = "/dashboard#pricing";
      return;
    }

    try {
      setProcessing(true);

      // Get token from localStorage
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Call Stripe checkout API
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: plan.stripeTier }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        alert(data.error || "Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
  const getButtonState = (plan) => {
    if (!isLoggedIn) {
      return {
        text: plan.buttonText,
        disabled: false,
        isCurrentPlan: false,
        className: plan.buttonColor,
      };
    }

    const planTierMap = {
      "FREE PLAN": "free",
      "PLUS PLAN": "tier2",
      "PREMIUM PLAN": "tier3",
    };

    const currentPlanTier = planTierMap[plan.name];
    const isCurrentPlan = userTier === currentPlanTier;

    let buttonText = plan.buttonText;
    let buttonClass = plan.buttonColor;
    let disabled = false;

    // Handle different user tiers
    if (userTier === "free") {
      // Free user: can upgrade to any plan
      if (plan.name === "FREE PLAN") {
        buttonText = "Current Plan";
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
      }
      // PLUS and PREMIUM plans are enabled for free users
    } else if (userTier === "tier2") {
      // Plus user logic
      if (plan.name === "FREE PLAN") {
        buttonText = "Free Plan";
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
        disabled = true; 
      } else if (plan.name === "PLUS PLAN") {
        buttonText = "Current Plan";
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
      } else if (plan.name === "PREMIUM PLAN") {
        buttonText = "Upgrade to Premium";
        // Keep enabled for upgrade
      }
    } else if (userTier === "tier3") {
      // Premium user logic
      if (plan.name === "FREE PLAN" || plan.name === "PLUS PLAN") {
        buttonText = plan.name === "FREE PLAN" ? "Free Plan" : "Plus Plan";
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
        disabled = true; 
      } else if (plan.name === "PREMIUM PLAN") {
        buttonText = "Current Plan";
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
      }
    }

    // Add processing state
    disabled = disabled || processing;

    return {
      text: buttonText,
      disabled: disabled,
      isCurrentPlan: isCurrentPlan,
      className: buttonClass,
    };
  };

  return (
    <section className="py-16 md:py-20" id="pricing">
      <div className="container mx-auto px-4 max-w-[1200px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-3">
            Select Your Plan
          </h2>
          <p className="text-lg text-[#666666] max-w-2xl mx-auto">
            Choose a plan designed to fit your lifestyle, goals, and budget —
            simple, flexible, and commitment-free.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const buttonState = getButtonState(plan);

            return (
              <div key={index} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className="text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div
                  className={`h-full  flex flex-col justify-between rounded-2xl border-2 p-6 bg-white ${
                    plan.popular
                      ? "border-[#8cc63c] shadow-lg"
                      : "border-gray-200"
                  } transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="text-center mb-8">
                    {!plan.popular && (
                      <div
                        className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                        style={{
                          backgroundColor: `${plan.color}15`,
                          color: plan.color,
                        }}
                      >
                        {plan.badge}
                      </div>
                    )}

                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-6">{plan.tagline}</p>

                    <div className="mb-6">
                      {plan.oldPrice && (
                        <div className="flex justify-center gap-2 mb-2">
                          <span className="text-gray-400 line-through text-sm">
                            {plan.oldPrice}
                          </span>
                          <span className="bg-[#8cc63c] text-white text-xs px-2 py-0.5 rounded">
                            Launch Deal
                          </span>
                        </div>
                      )}
                      <div className="flex justify-center gap-1 items-baseline">
                        <span
                          className="text-4xl font-bold"
                          style={{ color: plan.color }}
                        >
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-600">{plan.period}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <ul className="space-y-2">
                      {plan.features.included.map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.features.notIncluded.length > 0 && (
                    <div className="mb-6">
                      <ul className="space-y-2">
                        {plan.features.notIncluded.map((f, i) => (
                          <li key={i} className="flex gap-2">
                            <X className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-500">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mb-6 text-center bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Main Plan Button */}
                    <button
                      onClick={() => handlePayment(plan)}
                      disabled={buttonState.disabled}
                      className={`w-full py-3.5 rounded-lg font-semibold ${
                        buttonState.className
                      } ${
                        buttonState.disabled
                          ? "opacity-70 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {processing ? "Processing..." : buttonState.text}
                    </button>

                    {/* Cancel Button - Only show for PLUS and PREMIUM plans */}
                    {/* {isLoggedIn &&
                      userTier !== "free" &&
                      ["PLUS PLAN", "PREMIUM PLAN"].includes(plan.name) &&
                      buttonState.isCurrentPlan && (
                        <button
                          onClick={() => handleCancel(plan)}
                          disabled={cancelling}
                          className="w-full py-2.5 rounded-lg font-semibold bg-red-50 text-red-600 border border-red-300 hover:bg-red-100 mt-2"
                        >
                          {cancelling ? "Cancelling..." : "Cancel Plan"}
                        </button>
                      )} */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Status Info */}
        {isLoggedIn && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-800 text-sm text-center">
              👤 <strong>Current Account:</strong> {user.email} |{" "}
              <strong>Plan:</strong> {userTier?.toUpperCase() || "FREE"} |{" "}
              <strong>Swaps:</strong> {user.swapsAllowed || 1}
            </p>
          </div>
        )}
        {/* Comparison Table */}
        <div className="mt-16 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-[#1E1E1E] mb-4 text-center">
            Plan Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-3 font-medium text-gray-700">
                    Features
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    Free
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    Plus
                  </th>
                  <th className="p-3 text-center font-medium text-gray-700">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Weekly Meal Plans",
                    free: "1",
                    plus: "4 / week",
                    premium: "Unlimited",
                  },
                  {
                    feature: "Instacart Lists",
                    free: "1 / week",
                    plus: "4 / week",
                    premium: "Unlimited",
                  },
                  {
                    feature: "Save & Print",
                    free: "—",
                    plus: "✓",
                    premium: "✓",
                  },
                  {
                    feature: "Nutrition Insights",
                    free: "—",
                    plus: "✓",
                    premium: "✓",
                  },
                  {
                    feature: "Budget Tracking",
                    free: "—",
                    plus: "Limited",
                    premium: "✓",
                  },
                  {
                    feature: "Priority Support",
                    free: "—",
                    plus: "—",
                    premium: "✓",
                  },
                  {
                    feature: "Swaps per Plan",
                    free: "1",
                    plus: "2",
                    premium: "3",
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-100/50"}
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.feature}
                    </td>
                    <td className="p-3 text-center text-gray-600">
                      {row.free}
                    </td>
                    <td className="p-3 text-center text-green-600 font-medium">
                      {row.plus}
                    </td>
                    <td className="p-3 text-center text-[#1E1E1E] font-semibold">
                      {row.premium}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
