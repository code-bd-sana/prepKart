import { ChefHat, Leaf, DollarSign, Users } from "lucide-react";
import Image from "next/image";

export default function ProblemStatement() {
  const painPoints = [
    {
      title: "What do I cook today? — every. single. day.",
      icon: <ChefHat className="w-5 h-5" />,
    },
    {
      title: "Groceries going to waste",
      description: "",
      icon: <Leaf className="w-5 h-5" />,
    },
    {
      title: "Takeout eating up your budget",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      title: "Diet needs, allergies, picky family… exhausting",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <section className="pb-10 md:py-24">
      <div className="container mx-auto px-4 max-w-[1300px]">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Side - Image Section */}
          <div className="relative">
            {/* Main Image Container */}
            <div className="relative hidden md:flex rounded-2xl overflow-hidden md:-mt-5">
              <Image
                src="/HeroImage.png"
                width={749}
                height={549}
                alt="Marketplace"
                className="
      rounded-[22px] 
      w-full 
      max-w-[500px] sm:max-w-[600px] lg:max-w-[600px]
      object-contain
      max-h-[400px] sm:max-h-[450px] lg:max-h-[600px]
      shadow-2xl
    "
              />
            </div>
          </div>

          {/* Right Side */}
          <div>
            {/* Section Title */}
            <div className="mb-10">

              <h2 className="text-2xl md:text-4xl font-semibold text-gray-900 ">
                Everyday Cooking Should Not Feel This Hard
              </h2>
            </div>

            {/* Main Points Grid */}
            <div className="space-y-3">
              {painPoints.map((point, index) => (
                <div key={index} className="group relative overflow-hidden">
                  <div
                    className="flex items-center gap-4 p-2 rounded-xl border border-gray-200 bg-white 
                    transition-all duration-300 hover:bg-[#8cc63c] hover:text-white  hover:-translate-y-1"
                  >
                    {/* Left Icon */}
                    <div className="shrink-0">
                      <div
                        className="p-2.5 rounded-lg bg-blue-50 hover:bg-[#8cc63c]/10 
                        transition-colors duration-300"
                      >
                        <div className="text-gray-600 group-hover:text-black transition-colors duration-300">
                          {point.icon}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="grow">
                      <h3 className="font-semibold text-gray-900 ">
                        {point.title}
                      </h3>
                    </div>
                  </div>

                  {/* Hover Effect Background */}
                  <div
                    className="absolute inset-0 bg-linear-to-r from-[#8cc63c]/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-xl"
                  ></div>
                </div>
              ))}
              <p className="text-base text-gray-600 mb-8">
                You are not alone — Prepcart makes weekly meal planning simple
                again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
