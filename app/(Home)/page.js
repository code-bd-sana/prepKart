import HomeBanner from "@/components/Home/HomeBanner";
import HowItWorks from "@/components/Home/HowItWorks";
import QuickPlans from "@/components/Home/QuickPlans";
import MealPlanning from "@/components/Home/MealPlanning";
import GroceryListDemo from "@/components/Home/GroceryListDemo";
import PricingSection from "@/components/Home/PricingSection";
import Reasons from "@/components/Home/Reasons";
import Testimonials from "@/components/Home/Testimonials";
import Subscribe from "@/components/Home/Subscribe";

export default function HomePage() {
  return (
    <div>
      <HomeBanner />
      <HowItWorks />
      <QuickPlans />
      <MealPlanning />
      <PricingSection />
      <GroceryListDemo />
      <Reasons />
      <Testimonials />
      <Subscribe />
    </div>
  );
}
