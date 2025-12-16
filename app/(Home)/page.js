import HomeBanner from "@/components/Home/HomeBanner";
import HowItWorks from "@/components/Home/HowItWorks";
import QuickPlans from "@/components/Home/QuickPlans";
import MealPlanning from "@/components/Home/MealPlanning";
import GroceryListDemo from "@/components/Home/GroceryListDemo";
import PricingSection from "@/components/Home/PricingSection";
import Testimonials from "@/components/Home/Testimonials";
import Subscribe from "@/components/Home/Subscribe";
import WhyPeopleLove from "@/components/Home/WhyPeopleLove";
import FAQSection from "@/components/Home/FAQ";
import ProblemStatement from "@/components/Home/ProblemStatement";
// import GenerateWeeklyPlan from "@/components/Home/GenerateWeeklyPlan";

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      <HomeBanner />
      <ProblemStatement />
      <HowItWorks />
      <WhyPeopleLove />
      {/* <GenerateWeeklyPlan /> */}
      <QuickPlans />
      <MealPlanning />
      <PricingSection />
      <GroceryListDemo />
      <Testimonials />
      <FAQSection />
      <Subscribe />
    </div>
  );
}
