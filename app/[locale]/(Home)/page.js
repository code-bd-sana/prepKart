'use client';

import React from 'react';
import HomeBanner from "@/components/Home/HomeBanner";
import HowItWorks from "@/components/Home/HowItWorks";
import QuickPlans from "@/components/Home/QuickPlans";
import MealPlanning from "@/components/Home/MealPlanning";
// import GroceryListDemo from "@/components/Home/GroceryListDemo";
import PricingSection from "@/components/Home/PricingSection";
import Testimonials from "@/components/Home/Testimonials";
import Subscribe from "@/components/Home/Subscribe";
import WhyPeopleLove from "@/components/Home/WhyPeopleLove";
import FAQSection from "@/components/Home/FAQ";
import ProblemStatement from "@/components/Home/ProblemStatement";

export default function HomePage({ params }) {
  // Get locale from params
  const { locale } = React.use(params);
  return (
    <div className="bg-gray-50">
      <HomeBanner locale={locale} />
      <ProblemStatement locale={locale} />
      <HowItWorks locale={locale} />
      <WhyPeopleLove locale={locale} />
      <QuickPlans locale={locale} />
      <MealPlanning locale={locale} />
      <PricingSection locale={locale} />
      {/* <GroceryListDemo locale={locale} /> */}
      <Testimonials locale={locale} />
      <FAQSection locale={locale} />
      <Subscribe locale={locale} />
    </div>
  );
}

