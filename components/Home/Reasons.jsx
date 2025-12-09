import { HiOutlineGlobeAlt } from "react-icons/hi";
import { HiOutlineCpuChip } from "react-icons/hi2";
import { HiOutlineClock } from "react-icons/hi2";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { FaRegUser } from "react-icons/fa";

const reasons = [
  {
    icon: HiOutlineGlobeAlt,
    title: "Canada-Wide",
    desc: "Works in every province.",
    bg: "bg-teal-100",
    text: "text-[#4a9fd8]",
  },
  {
    icon: HiOutlineCpuChip,
    title: "AI-Powered",
    desc: "Personalized meal plans instantly.",
    bg: "bg-green-100",
    text: "text-[#8cc63c]",
  },
  {
    icon: HiOutlineClock,
    title: "Time-Saving",
    desc: "Grocery lists ready in seconds.",
    bg: "bg-teal-100",
    text: "text-[#4a9fd8]",
  },
  {
    icon: HiOutlineCurrencyDollar,
    title: "Budget-Friendly",
    desc: "Plans for $50–$100/week.",
    bg: "bg-green-100",
    text: "text-[#8cc63c]",
  },
  {
    icon: FaRegUser,
    title: "Family-Friendly",
    desc: "Meals for all ages and preferences.",
    bg: "bg-teal-100",
    text: "text-[#4a9fd8]",
  },
];

export default function Reasons() {
  return (
    <section className="py-6 md:py-12 bg-[linear-gradient(to_bottom,rgba(74,159,216,0.1),rgba(140,198,60,0.1))]">
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-16 relative items-start justify-items-center">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="relative w-full max-w-[320px] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >

              {/* Card */}
              <div className="py-4 px-6 h-[200px] md:h-[230px] hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div
                    className={`${reason.bg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <reason.icon
                      className={`h-7 w-7 ${reason.text}`}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-[#1E1E1E] mb-3">
                    {reason.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#666666] leading-relaxed text-[13px]">
                    {reason.desc}
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
