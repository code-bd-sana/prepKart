"use client"

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "Is Prepcart available across Canada?",
    answer: "Yes! Prepcart works anywhere in Canada. Our grocery integration supports major retailers like Walmart, Loblaws, Metro, Sobeys, and Costco, with real-time pricing and availability based on your postal code. We also adjust meal recommendations for regional availability and seasonal produce."
  },
  {
    question: "How are meal plans generated?",
    answer: "Prepcart uses AI (OpenAI) to create personalized meal plans based on your dietary preferences, budget, family size, and cooking time. The AI considers nutrition balance, ingredient overlap to reduce waste, and seasonal availability. You can regenerate plans until you find the perfect fit."
  },
  {
    question: "Can I adjust recipes for allergies or dietary restrictions?",
    answer: "Absolutely. During setup, you can specify allergies, intolerances, and dietary preferences (gluten-free, dairy-free, vegetarian, etc.). Our AI automatically excludes unsuitable ingredients and suggests alternatives. You can also manually swap any recipe in your plan."
  },
  {
    question: "Is Instacart required to use Prepcart?",
    answer: "No, Instacart is optional. While we offer seamless integration with Instacart for one-click grocery ordering, you can also use Prepcart to generate shopping lists and shop manually at any store. The app helps you compare prices across retailers regardless of how you choose to shop."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-20 bg-[linear-gradient(to_bottom,rgba(74,159,216,0.1),rgba(140,198,60,0.1))]" id="faq">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#666666]">
            Everything you need to know about Prepcart
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors duration-150"
              >
                <h3 className="font-semibold text-[#1E1E1E] pr-4">
                  {faq.question}
                </h3>
                <div className="shrink-0">
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-[#8cc63c]" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="p-5 pt-0">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-700 mb-6">
            Can not find what you are looking for?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-[#8cc63c] text-white rounded-lg font-semibold hover:bg-[#7cb52c] transition-colors duration-200">
              Chat with Support
            </button>
            <button className="px-6 py-3 bg-white border border-[#4a9fd8] text-[#4a9fd8] rounded-lg font-semibold hover:bg-[#4a9fd8] hover:text-white transition-colors duration-200">
              View Help Center
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}