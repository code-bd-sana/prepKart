// "use client";

// import { fetchUserData } from "@/store/slices/authSlice";
// import { Check } from "lucide-react";
// import { useSelector, useDispatch } from "react-redux";
// import { useState, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useTranslations } from "next-intl";
// import { useParams } from "next/navigation";

// export default function PricingSection() {
//   const { user, loading } = useSelector((state) => state.auth);
//   const [processing, setProcessing] = useState(false);
//   const dispatch = useDispatch();
//   const [cancelling, setCancelling] = useState(false);
//   const t = useTranslations("pricing");
//   const params = useParams();
//   const locale = params?.locale;

//   const isLoggedIn = Boolean(user);
//   const userTier = user?.tier;

//   // Get translated plans data
//   const translatedPlans = t.raw("plans");

//   // Plan styling data
//   const planStyles = [
//     {
//       name: "Free plan",
//       price: "Free",
//       oldPrice: null,
//       period: "",
//       color: "#4a9fd8",
//       buttonColor: "bg-[#4a9fd8] hover:bg-[#3a8fc8] text-white",
//       popular: false,
//       stripeTier: null,
//     },
//     {
//       name: "Plus plan",
//       price: "$4.99",
//       oldPrice: "$7.99",
//       period: "/mo",
//       color: "#8cc63c",
//       buttonColor: "bg-[#8cc63c] hover:bg-[#7cb52c] text-white",
//       popular: true,
//       stripeTier: "tier2",
//     },
//     {
//       name: "Premium plan",
//       price: "$9.99",
//       oldPrice: "$12.99",
//       period: "/mo",
//       color: "#1E1E1E",
//       buttonColor: "bg-[#1E1E1E] hover:bg-[#0E0E0E] text-white",
//       popular: false,
//       stripeTier: "tier3",
//     },
//   ];

//   // Combine translated content with styling
//   const plans = translatedPlans.map((plan, index) => ({
//     ...plan,
//     ...planStyles[index],
//   }));

//   const handleCancel = async (plan) => {
//     const message =
//       plan.name === "Free"
//         ? `Are you sure you want to cancel your ${
//             userTier === "tier2" ? "Plus" : "Premium"
//           } plan and switch to Free?`
//         : `Are you sure you want to cancel your ${plan.name} plan?`;

//     if (!window.confirm(message)) {
//       return;
//     }

//     try {
//       setCancelling(true);
//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       if (!token) {
//         toast.error("Please login to continue");
//         window.location.href = `/${locale}/login`;
//         return;
//       }

//       const response = await fetch("/api/billing/cancel", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = await response.json();

//       if (data.success) {
//         toast.success(`${plan.name} ${t("alerts.cancellationSuccess")}`);
//         dispatch(fetchUserData());
//       } else {
//         toast.error(t("alerts.cancellationFailed") + " " + data.error);
//       }
//     } catch (error) {
//       console.error("Cancel error:", error);
//       toast.error(t("alerts.somethingWrong"));
//     } finally {
//       setCancelling(false);
//     }
//   };

//   useEffect(() => {
//     const handleHashChange = () => {
//       const hash = window.location.hash;
//       if (hash.includes("#pricing")) {
//         const params = new URLSearchParams(hash.split("?")[1] || "");
//         const paramsObj = Object.fromEntries(params.entries());

//         if (paramsObj.error) {
//           toast.error(
//             t("alerts.paymentError") + " " + decodeURIComponent(paramsObj.error)
//           );
//           window.history.replaceState({}, "", "/#pricing");
//         }

//         if (paramsObj.payment === "success") {
//           toast.success(t("alerts.paymentSuccess"));
//           window.history.replaceState({}, "", "/#pricing");
//         }
//       }
//     };

//     handleHashChange();
//     window.addEventListener("hashchange", handleHashChange);
//     return () => window.removeEventListener("hashchange", handleHashChange);
//   }, [dispatch, t]);

//   const handlePayment = async (plan) => {
//     // For Free plan without stripeTier
//     if (!plan.stripeTier) {
//       if (!isLoggedIn) {
//         toast.error("Please login to access the Free plan");
//         setTimeout(() => {
//           window.location.href = `/${locale}/login`;
//         }, 1500);
//         return;
//       }

//       if (userTier !== "free") {
//         handleCancel(plan);
//         return;
//       }

//       window.location.href =`/${locale}`;
//       return;
//     }

//     // For Plus and Premium plans
//     if (!isLoggedIn) {
//       toast.error("Please login to subscribe to " + plan.name + " plan");
//       setTimeout(() => {
//         window.location.href = `/${locale}/login`;
//       }, 1500);
//       return;
//     }

//     try {
//       setProcessing(true);
//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");

//       if (!token) {
//         toast.error("Please login to continue");
//         window.location.href = `/${locale}/login`;
//         return;
//       }

//       const response = await fetch("/api/billing/subscribe", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ tier: plan.stripeTier }),
//       });

//       const data = await response.json();

//       if (data.success && data.url) {
//         // toast.success(t("alerts.paymentSuccess"));
//         window.location.href = data.url;
//       } else {
//         toast.error(data.error || t("alerts.paymentError"));
//       }
//     } catch (error) {
//       console.error("Payment error:", error);
//       toast.error(t("alerts.somethingWrong"));
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const getButtonState = (plan) => {
//     if (!isLoggedIn) {
//       return {
//         text: plan.buttonText,
//         disabled: false,
//         isCurrentPlan: false,
//         className: plan.buttonColor,
//       };
//     }

//     const planTierMap = {
//       Free: "free",
//       Plus: "tier2",
//       Premium: "tier3",
//     };

//     const currentPlanTier = planTierMap[plan.name];
//     const isCurrentPlan = userTier === currentPlanTier;

//     let buttonText = plan.buttonText;
//     let buttonClass = plan.buttonColor;
//     let disabled = false;

//     if (userTier === "free") {
//       if (plan.name === "Free plan") {
//         buttonText = t("messages.currentPlan");
//         buttonClass =
//           "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
//         disabled = true;
//       }
//     } else if (userTier === "tier2") {
//       if (plan.name === "Free plan") {
//         buttonText = t("messages.freePlan");
//         buttonClass =
//           "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
//         disabled = true;
//       } else if (plan.name === "Plus plan") {
//         buttonText = t("messages.currentPlan");
//         buttonClass =
//           "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
//         disabled = true;
//       } else if (plan.name === "Premium plan") {
//         buttonText = t("messages.upgradePremium");
//       }
//     } else if (userTier === "tier3") {
//       if (plan.name === "Free plan" || plan.name === "Plus plan") {
//         buttonText =
//           plan.name === "Free plan"
//             ? t("messages.freePlan")
//             : t("messages.plusPlan");
//         buttonClass =
//           "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
//         disabled = true;
//       } else if (plan.name === "Premium plan") {
//         buttonText = t("messages.currentPlan");
//         buttonClass =
//           "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
//         disabled = true;
//       }
//     }

//     disabled = disabled || processing;

//     return {
//       text: buttonText,
//       disabled: disabled,
//       isCurrentPlan: isCurrentPlan,
//       className: buttonClass,
//     };
//   };

//   return (
//     <section className="py-12 md:py-16" id="pricing">
//       <div className="container mx-auto px-4 max-w-6xl">
//         {/* Minimal Header */}
//         <div className="text-center mb-12">
//           <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
//             {t("title")}
//           </h2>
//           <p className="text-gray-600 max-w-xl mx-auto">{t("subtitle")}</p>
//         </div>

//         {/* Minimal Pricing Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {plans.map((plan, index) => {
//             const buttonState = getButtonState(plan);

//             return (
//               <div key={index} className="relative">
//                 {plan.popular && (
//                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
//                     <div className="bg-linear-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
//                       {plan.badge}
//                     </div>
//                   </div>
//                 )}

//                 <div
//                   className={`h-full flex flex-col rounded-xl border p-6 bg-white transition-all duration-200 ${
//                     plan.popular
//                       ? "border-emerald-300 shadow-lg ring-1 ring-emerald-50"
//                       : "border-gray-200 hover:border-gray-300"
//                   }`}
//                 >
//                   {/* Plan Header */}
//                   <div className="text-center mb-6">
//                     <div className="flex items-center justify-center gap-2 mb-3">
//                       {/* <span className="text-2xl">{plan.icon}</span> */}
//                       <h3 className="text-xl font-bold text-gray-900">
//                         {plan.name}
//                       </h3>
//                     </div>

//                     <p className="text-gray-600 text-sm mb-4">{plan.tagline}</p>

//                     {/* Price */}
//                     <div className="mb-4">
//                       <div className="flex justify-center items-baseline gap-1">
//                         <span className="text-3xl font-bold text-gray-900">
//                           {plan.price}
//                         </span>
//                         {plan.period && (
//                           <span className="text-gray-600 text-sm">
//                             {plan.period}
//                           </span>
//                         )}
//                       </div>
//                       {plan.oldPrice && (
//                         <div className="flex justify-center items-center gap-2 mt-1">
//                           <span className="text-gray-400 line-through text-sm">
//                             {plan.oldPrice}
//                           </span>
//                           <span className="bg-linear-to-r from-green-400 to-emerald-500 text-white text-xs px-2 py-0.5 rounded">
//                             {t("messages.launchDeal")}
//                           </span>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Features List */}
//                   <div className="mb-6 grow">
//                     <ul className="space-y-2.5">
//                       {plan.features.map((feature, i) => (
//                         <li key={i} className="flex items-start gap-2">
//                           <Check className="w-4 h-4 text-emerald-500 mt-0.5shrink-0" />
//                           <span className="text-sm text-gray-700">
//                             {feature}
//                           </span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>

//                   {/* Action Button */}
//                   <div className="mt-auto">
//                     <button
//                       onClick={() => handlePayment(plan)}
//                       disabled={buttonState.disabled}
//                       className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
//                         buttonState.className
//                       } ${
//                         buttonState.disabled
//                           ? "opacity-80 cursor-not-allowed"
//                           : "hover:shadow-md"
//                       }`}
//                     >
//                       {processing ? t("messages.processing") : buttonState.text}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Minimal User Status */}
//         {isLoggedIn && (
//           <div className="mt-8 p-4 bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg max-w-md mx-auto">
//             <div className="flex  items-center justify-center gap-4 text-sm text-gray-700">
//               <div className="flex items-center gap-1">
//                 {/* <span>{t("currentAccount")}</span> */}
//                 <span className="font-semibold">{user.email}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="font-medium">{t("plan")}</span>
//                 <span className="font-semibold px-2 py-0.5 bg-gray-200 rounded">
//                   {userTier?.toUpperCase() || "FREE"}
//                 </span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="font-medium">{t("swaps")}</span>
//                 <span className="font-semibold">{user.swapsAllowed || 1}</span>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

"use client";

import { fetchUserData } from "@/store/slices/authSlice";
import { Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function PricingSection() {
  const { user, loading } = useSelector((state) => state.auth);
  const [processing, setProcessing] = useState(false);
  const dispatch = useDispatch();
  const [cancelling, setCancelling] = useState(false);
  const t = useTranslations("pricing");
  const params = useParams();
  const locale = params?.locale;

  const isLoggedIn = Boolean(user);
  const userTier = user?.tier;

  // Get translated plans data
  const translatedPlans = t.raw("plans");

  // Plan styling data
  const planStyles = [
    {
      name: "Free plan",
      price: "Free",
      oldPrice: null,
      period: "",
      color: "#4a9fd8",
      buttonColor: "bg-[#4a9fd8] hover:bg-[#3a8fc8] text-white",
      popular: false,
      stripeTier: null,
    },
    {
      name: "Plus plan",
      price: "$4.99",
      oldPrice: "$7.99",
      period: "/mo",
      color: "#8cc63c",
      buttonColor: "bg-[#8cc63c] hover:bg-[#7cb52c] text-white",
      popular: true,
      stripeTier: "tier2",
    },
    {
      name: "Premium plan",
      price: "$9.99",
      oldPrice: "$12.99",
      period: "/mo",
      color: "#1E1E1E",
      buttonColor: "bg-[#1E1E1E] hover:bg-[#0E0E0E] text-white",
      popular: false,
      stripeTier: "tier3",
    },
  ];

  // Combine translated content with styling
  const plans = translatedPlans.map((plan, index) => ({
    ...plan,
    ...planStyles[index],
  }));

  const handleCancel = async (plan) => {
    const message = `Are you sure you want to cancel your ${plan.name} and switch to Free? This will take effect immediately.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setCancelling(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Please login to continue");
        window.location.href = `/${locale}/login`;
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
        toast.success(`${plan.name} ${t("alerts.cancellationSuccess")}`);
        dispatch(fetchUserData());
      } else {
        toast.error(t("alerts.cancellationFailed") + " " + data.error);
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(t("alerts.somethingWrong"));
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes("#pricing")) {
        const params = new URLSearchParams(hash.split("?")[1] || "");
        const paramsObj = Object.fromEntries(params.entries());

        if (paramsObj.error) {
          toast.error(
            t("alerts.paymentError") + " " + decodeURIComponent(paramsObj.error)
          );
          window.history.replaceState({}, "", "/#pricing");
        }

        if (paramsObj.payment === "success") {
          toast.success(t("alerts.paymentSuccess"));
          window.history.replaceState({}, "", "/#pricing");
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [dispatch, t]);

  const handlePayment = async (plan) => {
    // For Free plan without stripeTier
    if (!plan.stripeTier) {
      if (!isLoggedIn) {
        toast.error("Please login to access the Free plan");
        setTimeout(() => {
          window.location.href = `/${locale}/login`;
        }, 1500);
        return;
      }

      if (userTier !== "free") {
        handleCancel(plan);
        return;
      }

      window.location.href = `/${locale}`;
      return;
    }

    // For Plus and Premium plans
    if (!isLoggedIn) {
      toast.error("Please login to subscribe to " + plan.name + " plan");
      setTimeout(() => {
        window.location.href = `/${locale}/login`;
      }, 1500);
      return;
    }

    try {
      setProcessing(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login to continue");
        window.location.href = `/${locale}/login`;
        return;
      }

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
        window.location.href = data.url;
      } else {
        toast.error(data.error || t("alerts.paymentError"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(t("alerts.somethingWrong"));
    } finally {
      setProcessing(false);
    }
  };

  // ========== FIXED PLAN RESTRICTIONS LOGIC ==========
  const getButtonState = (plan) => {
    if (!isLoggedIn) {
      return {
        text: plan.buttonText,
        disabled: false,
        isCurrentPlan: false,
        className: plan.buttonColor,
        showCancel: false,
      };
    }

    const planTierMap = {
      "Free plan": "free",
      "Plus plan": "tier2",
      "Premium plan": "tier3",
    };

    const currentPlanTier = planTierMap[plan.name];
    const isCurrentPlan = userTier === currentPlanTier;

    let buttonText = plan.buttonText;
    let buttonClass = plan.buttonColor;
    let disabled = false;
    let showCancel = false;

    // ========== FREE USER LOGIC ==========
    if (userTier === "free") {
      if (plan.name === "Free plan") {
        buttonText = t("messages.currentPlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
        showCancel = false;
      }
      // Plus and Premium plans remain enabled
    }

    // ========== PLUS USER LOGIC ==========
    else if (userTier === "tier2") {
      if (plan.name === "Free plan") {
        buttonText = t("messages.freePlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
        disabled = true;
        showCancel = false;
      } else if (plan.name === "Plus plan") {
        buttonText = t("messages.currentPlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
        showCancel = true; // Show cancel button for Plus plan
      } else if (plan.name === "Premium plan") {
        buttonText = t("messages.upgradePremium");
        buttonClass = plan.buttonColor;
        disabled = false;
        showCancel = false;
      }
    }

    // ========== PREMIUM USER LOGIC ==========
    else if (userTier === "tier3") {
      if (plan.name === "Free plan") {
        buttonText = t("messages.freePlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
        disabled = true;
        showCancel = false;
      } else if (plan.name === "Plus plan") {
        buttonText = t("messages.plusPlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed";
        disabled = true;
        showCancel = false;
      } else if (plan.name === "Premium plan") {
        buttonText = t("messages.currentPlan");
        buttonClass =
          "bg-gray-100 text-gray-700 border border-gray-300 cursor-default";
        disabled = true;
        showCancel = true; // Show cancel button for Premium plan
      }
    }

    disabled = disabled || processing;

    return {
      text: buttonText,
      disabled: disabled,
      isCurrentPlan: isCurrentPlan,
      className: buttonClass,
      showCancel: showCancel,
    };
  };

  return (
    <section className="py-12 md:py-16" id="pricing">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        {/* Minimal Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const buttonState = getButtonState(plan);

            return (
              <div key={index} className="relative">
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-linear-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div
                  className={`h-full flex flex-col rounded-xl border p-6 bg-white transition-all duration-200 ${
                    plan.popular
                      ? "border-emerald-300 shadow-lg ring-1 ring-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{plan.tagline}</p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex justify-center items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-600 text-sm">
                            {plan.period}
                          </span>
                        )}
                      </div>
                      {plan.oldPrice && (
                        <div className="flex justify-center items-center gap-2 mt-1">
                          <span className="text-gray-400 line-through text-sm">
                            {plan.oldPrice}
                          </span>
                          <span className="bg-linear-to-r from-green-400 to-emerald-500 text-white text-xs px-2 py-0.5 rounded">
                            {t("messages.launchDeal")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mb-6 grow">
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button Area */}
                  <div className="mt-auto space-y-2">
                    {isLoggedIn && buttonState.showCancel && (
                      <button
                        onClick={() => handleCancel(plan)}
                        disabled={cancelling}
                        className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors duration-150"
                      >
                        {cancelling
                          ? t("messages.cancelling")
                          : t("messages.cancelPlan")}
                      </button>
                    )}
                    {/* Main Plan Button */}
                    <button
                      onClick={() => handlePayment(plan)}
                      disabled={buttonState.disabled}
                      className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                        buttonState.className
                      } ${
                        buttonState.disabled
                          ? "opacity-80 cursor-not-allowed"
                          : "hover:shadow-md"
                      }`}
                    >
                      {processing ? t("messages.processing") : buttonState.text}
                    </button>

                    {/* Small, Subtle Cancel Button */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal User Status */}
        {isLoggedIn && (
          <div className="mt-8 p-4 bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{t("plan")}</span>
                <span className="font-semibold px-2 py-0.5 bg-gray-200 rounded">
                  {userTier?.toUpperCase() || "FREE"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{t("swaps")}</span>
                <span className="font-semibold">{user.swapsAllowed || 1}</span>
              </div>
            </div>

            {/* Auto-renewal status */}
            {userTier !== "free" && user.subscription?.currentPeriodEnd && (
              <div className="mt-2 text-center text-xs text-gray-500">
                <span className="font-medium">Next billing:</span>{" "}
                {new Date(
                  user.subscription.currentPeriodEnd
                ).toLocaleDateString()}{" "}
                • Auto-renewal enabled
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
