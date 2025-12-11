// import { ShoppingCart, Calendar, Target, TrendingDown, Zap, Users, Shield, ChefHat } from "lucide-react";

// const plans = [
//   {
//     name: "FREE PLAN",
//     price: "Free",
//     tagline: "Try basics — no commitment",
//     badge: "Start Free",
//     color: "gray",
//     features: {
//       "Weekly Meal Plans": "1 / week",
//       "Instacart Shopping Lists": "1 / week",
//       "Save & Print Lists": "—",
//       "Macros & Nutrition": "—",
//       "Dashboard Access": "—",
//       "Budget Organizer": "—",
//       "New Recipes": "Limited",
//       "Priority Support": "—",
//       "New Features": "—",
//     }
//   },
//   {
//     name: "PLUS PLAN",
//     price: "$4.99",
//     period: "/month",
//     oldPrice: "$7.99",
//     tagline: "Most Popular • More flexibility",
//     badge: "Launch Deal",
//     color: "green",
//     features: {
//       "Weekly Meal Plans": "4 / week",
//       "Instacart Shopping Lists": "4 / week",
//       "Save & Print Lists": "✓",
//       "Macros & Nutrition": "✓",
//       "Dashboard Access": "✓",
//       "Budget Organizer": "Limited",
//       "New Recipes": "✓",
//       "Priority Support": "—",
//       "New Features": "—",
//     }
//   },
//   {
//     name: "PREMIUM PLAN",
//     price: "$9.99",
//     period: "/month",
//     oldPrice: "$12.99",
//     tagline: "Unlimited Access • Full experience",
//     badge: "Best Value",
//     color: "blue",
//     features: {
//       "Weekly Meal Plans": "Unlimited",
//       "Instacart Shopping Lists": "Unlimited",
//       "Save & Print Lists": "✓",
//       "Macros & Nutrition": "✓",
//       "Dashboard Access": "✓",
//       "Budget Organizer": "✓",
//       "New Recipes": "All + Early Access",
//       "Priority Support": "✓",
//       "New Features": "✓",
//     }
//   }
// ];

// export default function PricingSection() {
//   return (
//     <section className="py-12 md:py-20 bg-white" id="pricing">
//       <div className="container mx-auto px-4 max-w-[1200px]">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
//             Select Your Plan
//           </h2>
//           <p className="text-gray-600 text-lg">
//             Simple, flexible, and commitment-free
//           </p>
//         </div>

//         {/* Comparison Table */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[700px]">
//               {/* Header Row */}
//               <thead>
//                 <tr className="bg-gray-50">
//                   <th className="text-left p-6 font-semibold text-gray-700 text-lg">
//                     <div className="flex items-center gap-2">
//                       <Target className="w-5 h-5 text-blue-600" />
//                       Features
//                     </div>
//                   </th>
//                   {plans.map((plan, index) => (
//                     <th key={index} className="p-6 text-center">
//                       <div className="flex flex-col items-center gap-3">
//                         {/* Plan Badge */}
//                         <span className={`text-xs font-bold px-3 py-1 rounded-full ${
//                           plan.color === 'gray' 
//                             ? 'bg-gray-100 text-gray-800' 
//                             : plan.color === 'green'
//                             ? 'bg-green-100 text-green-800'
//                             : 'bg-blue-100 text-blue-800'
//                         }`}>
//                           {plan.badge}
//                         </span>
                        
//                         {/* Plan Name */}
//                         <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        
//                         {/* Price */}
//                         <div className="mt-2">
//                           {plan.oldPrice && (
//                             <div className="text-gray-400 line-through text-sm mb-1">
//                               {plan.oldPrice}
//                             </div>
//                           )}
//                           <div className="flex items-baseline justify-center gap-1">
//                             <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
//                             {plan.period && (
//                               <span className="text-gray-600 text-sm">{plan.period}</span>
//                             )}
//                           </div>
//                         </div>
                        
//                         {/* Tagline */}
//                         <p className="text-sm text-gray-500 mt-2">{plan.tagline}</p>
//                       </div>
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
              
//               {/* Table Body */}
//               <tbody>
//                 {Object.keys(plans[0].features).map((feature, rowIndex) => (
//                   <tr 
//                     key={rowIndex} 
//                     className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
//                   >
//                     {/* Feature Name */}
//                     <td className="p-5 font-medium text-gray-700 border-t border-gray-200">
//                       <div className="flex items-center gap-3">
//                         {/* Icons for specific features */}
//                         {feature === "Weekly Meal Plans" && <Calendar className="w-4 h-4 text-blue-500" />}
//                         {feature === "Instacart Shopping Lists" && <ShoppingCart className="w-4 h-4 text-green-500" />}
//                         {feature === "Macros & Nutrition" && <ChefHat className="w-4 h-4 text-emerald-500" />}
//                         {feature === "Budget Organizer" && <TrendingDown className="w-4 h-4 text-purple-500" />}
//                         {feature === "New Features" && <Zap className="w-4 h-4 text-amber-500" />}
//                         {feature}
//                       </div>
//                     </td>
                    
//                     {/* Plan Features */}
//                     {plans.map((plan, colIndex) => (
//                       <td 
//                         key={colIndex} 
//                         className={`p-5 text-center border-t border-gray-200 ${
//                           colIndex === 1 ? 'bg-green-50/30' : ''
//                         }`}
//                       >
//                         <span className={`font-medium ${
//                           plan.features[feature] === "✓" 
//                             ? 'text-green-600' 
//                             : plan.features[feature] === "—"
//                             ? 'text-gray-400'
//                             : plan.features[feature] === "Limited"
//                             ? 'text-gray-600'
//                             : plan.features[feature] === "All + Early Access"
//                             ? 'text-blue-600 font-semibold'
//                             : plan.features[feature] === "Unlimited"
//                             ? 'text-blue-600 font-semibold'
//                             : 'text-gray-700'
//                         }`}>
//                           {plan.features[feature]}
//                         </span>
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
              
//               {/* Footer with CTA Buttons */}
//               <tfoot>
//                 <tr className="bg-gray-50">
//                   <td className="p-5 border-t border-gray-200"></td>
//                   {plans.map((plan, index) => (
//                     <td key={index} className="p-5 text-center border-t border-gray-200">
//                       <button className={`
//                         w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
//                         ${plan.color === 'gray' 
//                           ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
//                           : plan.color === 'green'
//                           ? 'bg-green-600 text-white hover:bg-green-700'
//                           : 'bg-blue-600 text-white hover:bg-blue-700'
//                         }
//                       `}>
//                         {plan.color === 'gray' ? 'Get Started Free' : 
//                          plan.color === 'green' ? 'Start Plus Plan' : 
//                          'Go Premium'}
//                       </button>
//                     </td>
//                   ))}
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>

//         {/* Simple Footer Note */}
//         <div className="text-center mt-8">
//           <div className="inline-flex items-center gap-2 text-gray-600 text-sm">
//             <Shield className="w-4 h-4 text-gray-400" />
//             All plans include a 30-day money-back guarantee
//           </div>
//           <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
//             <div className="flex items-center gap-2">
//               <Users className="w-4 h-4" />
//               <span>14,200+ Canadians</span>
//             </div>
//             <div className="h-4 w-px bg-gray-300"></div>
//             <div>Cancel anytime</div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }


import { Check, X } from "lucide-react";

const plans = [
  {
    name: "FREE PLAN",
    tagline: "Try Prepcart with the basics — no commitment.",
    price: "Free",
    badge: "Try Now",
    color: "#4a9fd8", // Blue from your brand
    buttonColor: "bg-[#4a9fd8] hover:bg-[#3a8fc8] text-white",
    features: {
      included: [
        "1 meal plan per week",
        "1 grocery list",
        "Limited quick plans",
        "Limited recipes",
        "1 Instacart-integrated list",
        "Basic dashboard view"
      ],
      notIncluded: [
        "No saving meal plans",
        "No saving grocery lists",
        "No budget planner",
        "No macros/nutrition breakdown"
      ]
    },
    description: "Best for: First-time users",
    buttonText: "Get Started Free"
  },
  {
    name: "PLUS PLAN",
    tagline: "More flexibility. More control. Zero stress.",
    price: "$4.99",
    period: "/ month",
    oldPrice: "$7.99",
    badge: "Most Popular",
    color: "#8cc63c", // Green from your brand
    buttonColor: "bg-[#8cc63c] hover:bg-[#7cb52c] text-white",
    popular: true,
    features: {
      included: [
        "4 meal plans per week",
        "4 Instacart-integrated lists",
        "Save & print plans",
        "Macros & nutrition insights",
        "New weekly recipes",
        "Save favorite meals",
        "Full Dashboard Access",
        "Track budget",
        "Organize weekly plans"
      ],
      notIncluded: [
        "Limited budget organizer",
        "No priority support",
        "No early feature access"
      ]
    },
    description: "Best for: Busy individuals & families",
    buttonText: "Start Plus Plan"
  },
  {
    name: "PREMIUM PLAN",
    tagline: "The full Prepcart experience — effortless and personalized.",
    price: "$9.99",
    period: "/ month",
    oldPrice: "$12.99",
    badge: "Unlimited Access",
    color: "#1E1E1E", // Dark from your brand
    buttonColor: "bg-[#1E1E1E] hover:bg-[#0E0E0E] text-white",
    features: {
      included: [
        "Unlimited meal plans",
        "Unlimited Instacart lists",
        "All recipes unlocked",
        "Early access to new features",
        "Priority support",
        "Smart reminders & alerts",
        "Full Dashboard Access",
        "Save everything",
        "Track spending",
        "Build long-term meal routines"
      ],
      notIncluded: []
    },
    description: "Best for: Meal preppers, health-focused users, and power planners",
    buttonText: "Go Premium"
  }
];

export default function PricingSection() {
  return (
    <section className="py-16 md:py-20 " id="pricing">
      <div className="container mx-auto px-4 max-w-[1200px]">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-3">
            Select Your Plan
          </h2>
          <p className="text-lg text-[#666666] max-w-2xl mx-auto">
            Choose a plan designed to fit your lifestyle, goals, and budget — simple, flexible, and commitment-free.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div 
                    className="bg-[#8cc63c] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md"
                    style={{ backgroundColor: plan.color }}
                  >
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Card */}
              <div className={`
                h-full rounded-2xl border-2 p-6 bg-white
                ${plan.popular ? 'border-[#8cc63c] shadow-lg' : 'border-gray-200'}
                transition-all duration-300 hover:shadow-xl hover:-translate-y-1
              `}>
                
                {/* Plan Header */}
                <div className="text-center mb-8">
                  {!plan.popular && (
                    <div 
                      className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                      style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                    >
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-[#1E1E1E] mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.oldPrice && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-gray-400 line-through text-sm">{plan.oldPrice}</span>
                        <span className="bg-[#8cc63c] text-white text-xs font-bold px-2 py-0.5 rounded">
                          Launch Deal
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      <span 
                        className="text-4xl font-bold"
                        style={{ color: plan.color }}
                      >
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-600">{plan.period}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* What You Get */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    What You Get:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.included.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What's Not Included (only if there are items) */}
                {plan.features.notIncluded.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Whats Not Included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.notIncluded.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description */}
                <div className="mb-8 text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">{plan.description}</p>
                </div>

                {/* CTA Button */}
                <button 
                  className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-200 ${plan.buttonColor}`}
                  style={plan.popular ? { backgroundColor: plan.color } : {}}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table (Optional) */}
        <div className="mt-16 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-[#1E1E1E] mb-4 text-center">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left p-3 font-medium text-gray-700">Features</th>
                  <th className="p-3 text-center font-medium text-gray-700">Free</th>
                  <th className="p-3 text-center font-medium text-gray-700">Plus</th>
                  <th className="p-3 text-center font-medium text-gray-700">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Weekly Meal Plans", free: "1", plus: "4 / week", premium: "Unlimited" },
                  { feature: "Instacart Lists", free: "1 / week", plus: "4 / week", premium: "Unlimited" },
                  { feature: "Save & Print", free: "—", plus: "✓", premium: "✓" },
                  { feature: "Nutrition Insights", free: "—", plus: "✓", premium: "✓" },
                  { feature: "Budget Tracking", free: "—", plus: "Limited", premium: "✓" },
                  { feature: "Priority Support", free: "—", plus: "—", premium: "✓" },
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100/50'}>
                    <td className="p-3 font-medium text-gray-700">{row.feature}</td>
                    <td className="p-3 text-center text-gray-600">{row.free}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{row.plus}</td>
                    <td className="p-3 text-center text-[#1E1E1E] font-semibold">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}