"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQSection({ locale }) {
  const [openIndex, setOpenIndex] = useState(0);
  const t = useTranslations("faq");

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Get questions from translations
  const faqs = t.raw("questions");

  return (
    <section
      className="py-16 md:py-20 bg-[linear-gradient(to_bottom,rgba(74,159,216,0.1),rgba(140,198,60,0.1))]"
      id="faq"
    >
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1E1E1E] mb-3">
            {t("title")}
          </h2>
          <p className="text-lg text-[#666666]">{t("subtitle")}</p>
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
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-700 mb-6">{t("cantFind")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@prepcart.ca?subject=Chat Support Request - Prepcart"
              className="px-6 py-3 bg-[#8cc63c] text-white rounded-lg font-semibold hover:bg-[#7cb52c] transition-colors duration-200 inline-block text-center"
            >
              {t("chatSupport")}
            </a>
            <a
              href="mailto:info@prepcart.ca?subject=Help Center Inquiry - Prepcart"
              className="px-6 py-3 bg-white border border-[#4a9fd8] text-[#4a9fd8] rounded-lg font-semibold hover:bg-[#4a9fd8] hover:text-white transition-colors duration-200 inline-block text-center"
            >
              {t("helpCenter")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
