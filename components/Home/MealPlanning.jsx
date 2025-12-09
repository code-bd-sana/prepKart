import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { LuReplace, LuSparkles } from "react-icons/lu";

// demo
const plans = [
  {
    icon: HiOutlineCurrencyDollar ,
    title: "Budget-Friendly",
    desc: "Plans from $50–$100/week tailored to your spending limit.",
    bg: "bg-teal-100",
    text: "text-[#4a9fd8]",
  },
  {
    icon: FaRegUser,
    title: "Family-Friendly",
    desc: "Kid-approved recipes for 1 to 5+ people.",
    bg: "bg-green-100",
    text: "text-[#8cc63c]",
  },
  {
    icon: LuReplace,
    title: "Smart Swaps",
    desc: "Don't like an ingredient? Swap it with intelligent alternatives.",
    bg: "bg-teal-100",
    text: "text-[#4a9fd8]",
  },
  {
    icon: LuSparkles ,
    title: "AI-Powered",
    desc: "Regenerate any recipe instantly with unlimited variations.",
    bg: "bg-green-100",
    text: "text-[#8cc63c]",
  },
];

export default function MealPlanning() {
  return (
    <section className="py-6 md:py-20">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            Meal Planning, Reinvented
          </h2>
          <p className="text-base text-[#666666]">
            Al-powered meal creation, macro tracking, recipe swaps, and
            one-click grocery delivery.
          </p>
        </div>

        {/* Plans Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-16 relative items-start justify-items-center">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="relative w-full max-w-[320px] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >

              {/* Card */}
              <div className="bg-white rounded-xl shadow-sm py-4 px-6 h-[200px] md:h-[230px] hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                {/* Icon */}
                <div className="inline-flex mb-5">
                  <div
                    className={`${plan.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <plan.icon
                      className={`h-7 w-7 ${plan.text}`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-[#1E1E1E] mb-3">
                    {plan.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#666666] leading-relaxed text-[14px]">
                    {plan.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
