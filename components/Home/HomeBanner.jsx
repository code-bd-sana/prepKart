"use client";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiMic } from "react-icons/fi";

export default function HomeBanner() {
  return (
    <section
      className="
      w-full 
      bg-white
      px-4 sm:px-10 md:px-12 lg:px-20 
      py-8 md:py-12 lg:py-16
    "
    >
      <div
        className="
        max-w-[1500px] mx-auto 
        flex flex-col lg:flex-row 
        items-center lg:items-start 
        justify-between 
        gap-10 lg:gap-0
      "
      >
        {/* LEFT SIDE */}
        <div className="w-full lg:w-[45%]">
          {/* Heading */}
          <h1
            className="
            text-[32px] sm:text-[38px] md:text-[50px] lg:text-[65px]
            
            leading-10 sm:leading-12 md:leading-[55px] lg:leading-[62px]
            tracking-[-0.5px]
            text-[#1E1E1E]
            mb-5
          "
          >
            From Kitchen Stress to <br className="hidden lg:block" />
            Grocery Success
          </h1>

          {/* Subtext */}
          <p
            className="
            text-[15px] md:text-[16px]
            leading-6 md:leading-[26px]
            text-[#666666]
            w-full md:w-[650px]
            mb-10
          "
          >
            Stop wasting money and food. Let Al create personalized meal plans,
            smart grocery lists, and send them straight to Instacart. Save time,
            eat better, spend less
          </p>

          {/* Voice/Text Input Section */}
          <div className="mb-8">
            <div className="relative max-w-[650px]">
              <div className="flex items-center gap-2 mb-3">
                {/* Input Field */}
                <input
                  type="text"
                  placeholder="Speak or type your preferences..."
                  className="
          flex-1 
          h-8 md:h-12 
          px-4 md:px-6 
          rounded-lg 
          border border-gray-300 
          focus:border-primary-500 
          focus:ring-2 focus:ring-primary-200 
          focus:outline-none
          text-gray-700
          placeholder:text-gray-400
          shadow-md hover:shadow-lg 
          transition-shadow duration-200
        "
                />
                {/* Mic Button */}
                <button
                  type="button"
                  className="
          h-8 md:h-12 
          w-12 md:w-14 
          rounded-lg 
          border border-[#5a9e3a]
          flex items-center justify-center
          transition-all duration-200
          shadow-md hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed
        "
                >
                  <FiMic className="text-[#5a9e3a]" />
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div
            className="
            flex flex-col sm:flex-row 
            items-start sm:items-center 
            gap-3 
            mt-6
          "
          >
            <Link href="/marketplace">
              <button
                className="
              p-3 text-[14px] font-medium 
              text-white 
              rounded-[10px] 
              bg-[#8cc63c]
              hover:bg-[#5a9e3a]
              transition-colors
              shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
              w-full sm:w-auto
              flex items-center justify-center gap-2
            "
              >
                Generate My Meal Plan <FiArrowRight />
              </button>
            </Link>

            <Link href="/services">
              <button
                className="
              p-3 text-[14px] font-medium 
              text-[#4a9fd8] hover:text-white
              rounded-[10px] border-2 border-[#4a9fd8]
              bg-white hover:bg-[#4a9fd8]
              transition-colors
              shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
              w-full sm:w-auto
              flex items-center justify-center gap-2
            "
              >
                Start With a Quick-Start Plan <FiArrowRight />
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="w-full lg:w-[55%] flex justify-end">
          <Image
            src="/HeroImage.png"
            width={749}
            height={549}
            alt="Marketplace"
            className="
      rounded-[22px] 
      w-full 
      max-w-[500px] sm:max-w-[600px] lg:max-w-[580px]
      object-contain
      max-h-[400px] sm:max-h-[450px] lg:max-h-[500px]
    "
          />
        </div>
      </div>
    </section>
  );
}
