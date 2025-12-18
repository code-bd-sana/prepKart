import { ChefHat, Leaf, DollarSign, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ProblemStatement({ locale }) {
  const t = useTranslations("problemStatement");
  const IconComponents = [ChefHat, Leaf, DollarSign, Users];

  return (
    <section className="pb-10 md:py-24">
      <div className="container mx-auto px-4 max-w-[1300px]">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Side - Image Section */}
          <div className="relative">
            <div className="relative hidden md:flex rounded-2xl overflow-hidden md:-mt-5">
              <Image
                src="/HeroImage3.png"
                width={749}
                height={349}
                alt={locale === "fr" ? "Marché" : "Marketplace"}
                className="rounded-[22px] w-full max-w-[500px] object-contain max-h-[500px] shadow-2xl"
              />
            </div>
          </div>

          {/* Right Side */}
          <div>
            <div className="mb-10">
              <h2 className="text-2xl md:text-4xl font-semibold text-gray-900">
                {t("title")}
              </h2>
            </div>

            <div className="space-y-3">
              {[0, 1, 2, 3].map((index) => {
                const Icon = IconComponents[index];

                return (
                  <div key={index} className="group relative overflow-hidden">
                    <div className="flex items-center gap-4 p-2 rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:bg-[#8cc63c] hover:text-white hover:-translate-y-1">
                      {/* Icon */}
                      <div className="shrink-0">
                        <div className="p-2.5 rounded-lg bg-blue-50 hover:bg-[#8cc63c]/10 transition-colors duration-300">
                          <div className="text-gray-600 group-hover:text-black transition-colors duration-300">
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      {/* Text */}
                      <div className="grow">
                        <h3 className="text-gray-900">
                          {t.rich(`painPoints.${index}.title`, {
                            highlight: (chunks) => (
                              <strong className="font-bold text-primary">
                                {chunks}
                              </strong>
                            ),
                            italic: (chunks) => (
                              <em className="italic font-medium">{chunks}</em>
                            ),
                          })}
                        </h3>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-linear-to-r from-[#8cc63c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-xl"></div>
                  </div>
                );
              })}

              <p className="text-base text-gray-600 mb-8">{t("description")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
