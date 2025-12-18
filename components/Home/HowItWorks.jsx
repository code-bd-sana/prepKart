import { HiAdjustmentsVertical } from "react-icons/hi2";
import { LuShoppingCart } from "react-icons/lu";
import { RiAiGenerate } from "react-icons/ri";
import { useTranslations } from 'next-intl';

export default function HowItWorks({ locale }) { 
  const t = useTranslations('howItWorks'); 
  
  const stepData = t.raw('steps');
  
  const stepConfig = stepData.map((step, index) => {
    const icons = [HiAdjustmentsVertical, RiAiGenerate, LuShoppingCart];
    const bgColors = ["bg-[#8cc63c]", "bg-[#8cc63c]", "bg-[#8cc63c]"];
    const strokeWidths = [1, 1, 2];
    
    return {
      ...step,
      icon: icons[index],
      bgColor: bgColors[index],
      strokeWidth: strokeWidths[index]
    };
  });

  return (
    <section className="py-16 md:py-20 " id="howitworks">  
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

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 relative items-start justify-items-center">
          {stepConfig.map((step, index) => (
            <div
              key={`${step.title}-${index}`} 
              className="relative w-full max-w-[320px] animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-6 z-10">
                <div className="h-10 w-10 rounded-full bg-[#4a9fd8] text-white flex items-center justify-center font-semibold text-base shadow-md hover:scale-110 transition-transform duration-300">
                  {index + 1}
                </div>
              </div>

              {/* Card */}
              <div className="bg-white rounded-xl shadow-sm pt-12 pb-8 px-6 h-[300px] md:h-[300px] hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div
                    className={`${step.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <step.icon
                      className="h-8 w-8 text-white"
                      strokeWidth={step.strokeWidth}
                    />
                  </div>
                </div>

                {/* Content  */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#1E1E1E] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#666666] leading-relaxed text-[14px]">
                    {step.description}
                  </p>
                </div>
              </div>

              {index < stepConfig.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(100%+2px)] w-32 h-1 bg-[#8cc63c] z-0 animate-expand-line"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}