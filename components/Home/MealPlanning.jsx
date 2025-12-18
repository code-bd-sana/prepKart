import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { FaRegUser } from "react-icons/fa";
import { LuReplace, LuSparkles } from "react-icons/lu";
import { useTranslations } from 'next-intl';

export default function MealPlanning() {
  const t = useTranslations('mealPlanning');
  
  // Get the plans data from translations
  const translatedPlans = t.raw('plans');
  
  // Keep the styling and icon data separate from translations
  const planStyles = [
    {
      icon: HiOutlineCurrencyDollar,
      bg: "bg-teal-100",
      text: "text-[#4a9fd8]",
    },
    {
      icon: FaRegUser,
      bg: "bg-green-100",
      text: "text-[#8cc63c]",
    },
    {
      icon: LuReplace,
      bg: "bg-teal-100",
      text: "text-[#4a9fd8]",
    },
    {
      icon: LuSparkles,
      bg: "bg-green-100",
      text: "text-[#8cc63c]",
    },
  ];

  // Combine translated content with styling
  const plans = translatedPlans.map((plan, index) => ({
    ...plan,
    ...planStyles[index]
  }));

  return (
    <section className="py-6 md:py-20">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            {t('title')}
          </h2>
          <p className="text-base text-[#666666]">
            {t('subtitle')}
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