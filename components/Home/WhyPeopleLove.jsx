import {
  MdOutlineShoppingBag,
  MdOutlineSavings,
  MdOutlineRestaurant,
  MdOutlineCompareArrows,
} from "react-icons/md";
import { useTranslations } from 'next-intl'; 

export default function WhyPeopleLove({ locale }) { 
  const t = useTranslations('whyPeopleLove');
  
  const reasonData = t.raw('reasons');
  
  const reasons = reasonData.map((reason, index) => {
    const icons = [
      MdOutlineShoppingBag,
      MdOutlineSavings,
      MdOutlineRestaurant,
      MdOutlineCompareArrows
    ];
    const colors = [
      "text-[#4a9fd8]",
      "text-[#7ab32f]",
      "text-[#4a9fd8]",
      "text-[#7ab32f]"
    ];
    
    return {
      ...reason,
      icon: icons[index],
      text: colors[index]
    };
  });

  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-[1300px]">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
            {t('title')}
          </h2>
          <p className="text-base text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/*Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 items-stretch">
          {reasons.map((reason, index) => (
            <div key={`${reason.title}-${index}`} className="group h-full">
              <div className="flex flex-col items-center text-center h-full">
                {/* Icon  */}
                <div className="mb-6">
                  <reason.icon
                    className={`h-12 w-12 ${reason.text} opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight min-h-12">
                  {reason.title}
                </h3>

                {/* Description  */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4 min-h-18">
                  {reason.desc}
                </p>

                <div className="mt-auto h-px w-0 group-hover:w-12 bg-current transition-all duration-300 opacity-0 group-hover:opacity-30"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}