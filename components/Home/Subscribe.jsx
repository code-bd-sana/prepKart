export default function Subscribe() {
  return (
    <section className="py-6 md:py-16 bg-[#8cc63c]">
      <div className="container mx-auto px-4 ">
        {/* Header */}
        <div className="text-center mb-16 max-w-[700px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 ">
            Get Tips, Updates & Meal Planning Inspiration!
          </h2>
          <p className="text-base text-white">
            Join our community and stay updated with the latest recipes,
            nutrition tips and exclusive offers
          </p>
        </div>
        <div className="max-w-[700px] mx-auto">
          {/* Input of Email & Postal */}
          <div className="flex justify-center items-center gap-5">
            <input
              className="flex-1 
          h-8 md:h-12 
          px-4 md:px-6 
          rounded-lg 
          border border-white
          bg-white
          focus:border-primary-500 
          focus:ring-2 focus:ring-primary-200 
          focus:outline-none
          text-gray-700
          placeholder:text-gray-400
          shadow-md hover:shadow-lg 
          transition-shadow duration-200"
              type="email"
              name="email"
              placeholder="Your Email Address"
              id=""
            />
            <input
              className="flex-1 
          h-8 md:h-12 
          px-4 md:px-6 
          rounded-lg 
          bg-white
          border border-white
          focus:border-primary-500 
          focus:ring-2 focus:ring-primary-200 
          focus:outline-none
          text-gray-700
          placeholder:text-gray-400
          shadow-md hover:shadow-lg 
          transition-shadow duration-200"
              type="text"
              name="postal"
              placeholder="Postal Code (e.g. M5H 2N2)"
              id=""
            />
          </div>
          {/* Subscribe Button */}
          <button
            className="
              mt-5
              p-3 text-[16px] font-bold
              
              rounded-[10px] 
              bg-white
              transition-colors
              shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
              w-full
              flex items-center justify-center gap-2
            "
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </section>
  );
}
