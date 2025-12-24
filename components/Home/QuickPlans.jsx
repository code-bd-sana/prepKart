"use client";

import { FiArrowRight, FiLock } from "react-icons/fi";
import { LuCrown } from "react-icons/lu";
import Link from "next/link";
import { FaAppleAlt, FaLeaf, FaDollarSign, FaBolt, FaHome, FaStar } from "react-icons/fa";
import { GiMeal, GiChickenOven, GiFruitBowl, GiBowlOfRice } from "react-icons/gi";
import { MdDinnerDining, MdLocalDining, MdFreeBreakfast } from "react-icons/md";
import { SiCodechef } from "react-icons/si";
import Image from "next/image";
import { useState } from "react";
import QuickPlanModal from "./QuickPlanModal";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function QuickPlans({ locale }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const t = useTranslations("quickPlans");
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showQuickPlanModal, setShowQuickPlanModal] = useState(false);

  // Expanded icon map
  const ICON_MAP = {
    // React icons
    lowCarb: FaAppleAlt,
    vegetarian: FaLeaf,
    budget: FaDollarSign,
    quick: FaBolt,
    family: FaHome,
    gourmet: FaStar,
    meal: GiMeal,
    chicken: GiChickenOven,
    fruit: GiFruitBowl,
    rice: GiBowlOfRice,
    dinner: MdDinnerDining,
    dining: MdLocalDining,
    breakfast: MdFreeBreakfast,
    chef: SiCodechef,
    
    // Add more as needed
  };

  // Get plans from translations
  const quickPlans = t.raw("plans");

  const handlePlanClick = (planKey) => {
    if (!user) {
      // Redirect to login
      router.push("/login?redirect=/quick-meals");
      return;
    }

    setSelectedPlan(planKey);
    setShowQuickPlanModal(true);
  };

  // Helper to get icon component
  const getIconComponent = (plan) => {
    if (plan.iconType === "react-icon") {
      const IconComponent = ICON_MAP[plan.icon];
      return IconComponent ? (
        <IconComponent className="mx-auto text-3xl" />
      ) : (
        <GiMeal className="mx-auto text-3xl" />
      );
    } else if (plan.iconType === "image") {
      return (
        <Image
          src={plan.icon}
          alt={plan.title}
          width={55}
          height={55}
          className="mx-auto"
        />
      );
    } else {
      // Emoji or text
      return <span className="text-4xl">{plan.icon}</span>;
    }
  };

  return (
    <>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-[1200px]">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E]">
              {t("title")}
            </h2>
            <p className="text-base text-[#666666] mt-2">
              {t("subtitle")}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickPlans.map((plan, index) => (
              <div
                key={`${plan.title}-${index}`}
                className="relative rounded-2xl bg-white p-8 border-2 border-[#E5E5E5] shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col h-full"
              >
                {/* PREMIUM BADGE */}
                {plan.premium && (
                  <div className="absolute -top-4 -right-3 bg-[#FFB800] w-10 h-10 rounded-full flex flex-col items-center justify-center shadow-md">
                    <span className="text-white text-lg font-bold leading-none">
                      <LuCrown />
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="flex flex-col grow">
                  <div className="flex justify-center text-5xl mb-4">
                    {getIconComponent(plan)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-center text-[#1E1E1E] mb-1">
                    {plan.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-center text-[#666666] mb-6">
                    {plan.description}
                  </p>
                </div>

                {/* BUTTONS */}
                <div className="mt-auto">
                  {plan.premium && (!user || user.tier !== "tier3") ? (
                    <button className="w-full hover:bg-[#8cc63c] hover:text-white border border-[#E2E2E2] text-[#1E1E1E] text-sm py-2.5 rounded-lg font-medium flex items-center justify-center gap-2">
                      <FiLock className="h-4 w-4" />
                      {t("premium")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanClick(plan.key)}
                      className="w-full bg-white border border-[#E2E2E2] text-[#1E1E1E] text-sm py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#8cc63c] hover:text-white transition"
                    >
                      {t("viewPlan")}
                      <FiArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 bg-linear-to-r from-[#8cd46b] to-[#71b5e2] rounded-2xl px-10 md:px-12 py-16 text-center text-white max-w-[1500px] mx-auto">
            <h3 className="text-xl md:text-3xl font-semibold mb-2">
              {t("ctaTitle")}
            </h3>
            <p className="text-sm md:text-base mb-6 opacity-95">
              {t("ctaSubtitle")}
            </p>
            <Link href={"#pricing"}>
              <button className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-gray-50 transition">
                {t("ctaButton")}
                <FiArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Plan Modal */}
      <QuickPlanModal
        isOpen={showQuickPlanModal}
        onClose={() => setShowQuickPlanModal(false)}
        planType={selectedPlan}
        locale={locale}
      />
    </>
  );
}