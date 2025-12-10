import { Check, Lock } from "lucide-react";

const tiers = [
  {
    topLabel: "Free",
    highlight: false,
    title: "Perfect for trying out Prepcart",
    price: "$0",
    priceNote: "/ forever",
    button: "Get Started Free",
    features: [
      { text: "AI meal plans (OpenAI)", included: true },
      { text: "Grocery list generation", included: true },
      { text: "Instacart integration", included: true },
      { text: "View sample recipes", included: true },
      { text: "1–2 plan generations per day", included: true },
      { text: "Save 2 meal plans max", included: true },
      { text: "Basic nutrition overview", included: true },
      { text: "10 favorite recipes max", included: true },
      { text: "Premium recipes (Edamam)", included: false },
      { text: "Unlimited saved plans", included: false },
      { text: "Advanced nutrition tracking", included: false },
      { text: "Calendar sync & reminders", included: false },
      { text: "Budget analytics", included: false },
    ],
  },
  {
    badge: "Most Popular",
    highlight: true,
    topLabel: "Premium",
    title: "For regular meal planners",
    oldPrice: "$7.13",
    price: "$4.99",
    priceNote: "/ month",
    save: "Save 30%",
    button: "Start Premium",
    features: [
      { text: "Everything in Free, plus:", header: true },
      { text: "Premium recipes (Edamam API)", included: true },
      { text: "Save unlimited meal plans", included: true },
      { text: "Advanced nutrition tracking", included: true },
      { text: "5 plans per day", included: true },
      { text: "Calendar sync & reminders", included: true },
      { text: "Save 50 favorite recipes", included: true },
      { text: "Budget tracking & alerts", included: true },
      { text: "Export & print plans", included: true },
      { text: "20% off annual plan", included: true },
      { text: "Family expense splitting", included: false },
      { text: "Multi-user profiles", included: false },
    ],
  },
  {
    badge: "Best Value",
    highlight: false,
    topLabel: "Family",
    title: "Best for families & heavy users",
    oldPrice: "$14.27",
    price: "$9.99",
    priceNote: "/ month",
    save: "Save 30%",
    button: "Go Unlimited",
    features: [
      { text: "Everything in Premium, plus:", header: true },
      { text: "Unlimited plan generations", included: true },
      { text: "Unlimited favorite recipes", included: true },
      { text: "Family member profiles (up to 6)", included: true },
      { text: "Family calendar & schedule view", included: true },
      { text: "Family expense splitting", included: true },
      { text: "Price comparison across stores", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
];

export default function PricingSection() {
  return (
    <section className="py-8 md:py-20" id="pricing">
      {/* Header */}
      <div>
        <p className="text-sm text-red-700 bg-red-200 flex max-w-[260px] mx-auto text-center p-1.5 rounded-2xl mb-5">
          🎉 Launch Promotions: 30% off all Plans!
        </p>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            Choose Your Plan
          </h2>
          <p className="text-base text-[#666666]">
            Start free and upgrade anytime. All plans include our core AI meal
            planning features.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 container mx-auto px-4 max-w-[1300px]">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className={`rounded-2xl border shadow-sm p-6 flex flex-col relative 
              ${
                tier.highlight
                  ? "border-[#8cc63c] shadow-md"
                  : "border-gray-200"
              }
            `}
          >
            {/* Badge */}
            {tier.badge && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white
                  ${
                    tier.badge === "Best Value"
                      ? "bg-[#4a9fd8]"
                      : tier.badge === "Most Popular"
                      ? "bg-[#8cc63c]"
                      : "bg-[#8cc63c]"
                  }
                `}
              >
                {tier.badge}
              </div>
            )}

            {/* Title + Subtitle Logic */}
            <h2 className="text-xl font-bold text-center mt-4">
              {tier.topLabel ? tier.topLabel : tier.title}
            </h2>

            {tier.topLabel && (
              <p className="text-center text-gray-600">{tier.title}</p>
            )}

            {/* Price Section */}
            <div className="text-center mt-4">
              <div className="flex justify-center items-center gap-2">
                {tier.oldPrice && (
                  <p className="text-gray-400 line-through">{tier.oldPrice}</p>
                )}
                {tier.save && (
                  <span className="text-green-600 text-sm font-semibold">
                    {tier.save}
                  </span>
                )}
              </div>

              <p className="text-4xl font-bold mt-1">
                {tier.price}
                <span className="text-gray-600 text-sm ml-1">
                  {tier.priceNote}
                </span>
              </p>
            </div>

            {/* Features */}
            <div className="border-t pt-4 mt-4 flex-1">
              {tier.features.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                  {f.header ? (
                    <span className="font-semibold text-gray-800">
                      {f.text}
                    </span>
                  ) : f.included ? (
                    <Check className="w-4 h-4 text-green-600 mt-1" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400 mt-1" />
                  )}

                  {!f.header && (
                    <span
                      className={`${
                        f.included
                          ? "text-gray-700"
                          : "text-gray-400 line-through"
                      }`}
                    >
                      {f.text}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Button (bottom aligned) */}
            <button
              className={`mt-6 w-full py-3 rounded-xl font-semibold
               ${
                 tier.highlight
                   ? "bg-[#8cc63c]  text-white " // PREMIUM = green
                   : "border border-gray-400 text-gray-600" // FREE + FAMILY = blue
               }
              `}
            >
              {tier.button}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
