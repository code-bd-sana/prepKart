import { GiFruitBowl } from "react-icons/gi";
import { FiArrowRight, FiLock } from "react-icons/fi";

// Demo
const quickPlans = [
  {
    title: "Keto",
    description: "Low-carb, high-fat meals",
    logo: GiFruitBowl,
    premium: true,
  },
  {
    title: "Vegan",
    description: "100% plant-based",
    logo: GiFruitBowl,
    premium: false,
  },
  {
    title: "Vegetarian",
    description: "Meat-free, protein-rich",
    logo: GiFruitBowl,
    premium: false,
  },
  {
    title: "Halal",
    description: "Halal-certified",
    logo: GiFruitBowl,
    premium: true,
  },
  {
    title: "Gluten-Free",
    description: "No gluten, full flavour",
    logo: GiFruitBowl,
    premium: false,
  },
  {
    title: "High-Protein",
    description: "Muscle-building meals",
    logo: GiFruitBowl,
    premium: true,
  },
  {
    title: "Low-Carb",
    description: "Reduced carbs",
    logo: GiFruitBowl,
    premium: false,
  },
  {
    title: "Family-Friendly",
    description: "Kid-approved",
    logo: GiFruitBowl,
    premium: true,
  },
  {
    title: "Budget-Friendly",
    description: "Under $75/week",
    logo: GiFruitBowl,
    premium: false,
  },
];

export default function QuickPlans() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="container mx-auto px-4 max-w-[1200px]">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
              Quick Plans with Brand New Recipes
            </h2>
            <p className="text-base text-[#666666]">
              Choose from our curated meal plans. Each includes a complete 5- or
              7-day schedule.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                {/* Crown Icon for Premium */}
                {plan.premium && (
                  <div className="absolute -top-5 -right-3 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl">
                    👑
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <plan.logo className="h-12 w-12 text-[#5a9e3a]" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[#1E1E1E] text-center mb-2">
                  {plan.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#666666] text-center mb-5">
                  {plan.description}
                </p>

                {/* Button */}
                {plan.premium ? (
                  <button className="w-full bg-[#4a9fd8] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:text-[#4a9fd8] hover:border hover:border-[#4a9fd8] hover:bg-white transition-colors">
                    <FiLock className="h-4 w-4" />
                    Premium
                  </button>
                ) : (
                  <button className="w-full bg-white  border border-gray-200 text-[#1E1E1E] py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#F0F9F4] transition-colors">
                    View Plan
                    <FiArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Section */}
        <div className="mt-16 bg-linear-to-r from-[#5a9e3a] to-[#4a9fd8] rounded-2xl px-8 md:px-12 py-3 text-center text-white max-w-[700px] mx-auto">
          <h3 className="text-xl md:text-3xl font-semibold mb-3">
            Unlock Premium Recipe Collections
          </h3>
          <p className="text-base md:text-sm mb-6 opacity-95">
            Subscribe for all premium plans, unlimited AI generations, and
            exclusive recipes
          </p>
          <button className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-gray-50 transition-colors">
            Try 7 Days Free
            <FiArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
