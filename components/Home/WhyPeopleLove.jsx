import {
  MdOutlineShoppingBag,
  MdOutlineSavings,
  MdOutlineRestaurant,
  MdOutlineCompareArrows,
} from "react-icons/md";

const reasons = [
  {
    icon: MdOutlineShoppingBag,
    title: "Save Up to 30% on Groceries",
    desc: "Buy only what you need and reduce food waste every week.",
    text: "text-[#4a9fd8]",
  },
  {
    icon: MdOutlineSavings,
    title: "Cut Monthly Food Costs by $80–$150",
    desc: "Smart planning keeps your grocery bill predictable and on budget.",
    text: "text-[#7ab32f]",
  },
  {
    icon: MdOutlineRestaurant,
    title: "Zero Meal Stress",
    desc: "Your weekly plan is created for you — no guessing, no decision fatigue.",
    text: "text-[#4a9fd8]",
  },
  {
    icon: MdOutlineCompareArrows,
    title: "Smart Grocery Sync",
    desc: "Compare prices across stores instantly and shop your list in one tap.",
    text: "text-[#7ab32f]",
  },
];

export default function WhyPeopleLove() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            Why People Love PrepCart
          </h2>
          <p className="text-base text-gray-600">
            Join thousands of Canadians who are transforming their grocery
            routine
          </p>
        </div>

        {/* Minimal Grid - No Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {reasons.map((reason, index) => (
            <div key={index} className="group">
              <div className="flex flex-col items-center text-center">
                {/* Icon - Minimal */}
                <div className="mb-6">
                  <reason.icon
                    className={`h-12 w-12 ${reason.text} opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
                  {reason.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {reason.desc}
                </p>

                {/* Add this subtle hover effect */}
                <div className="h-px w-0 group-hover:w-12 bg-current transition-all duration-300 opacity-0 group-hover:opacity-30"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
