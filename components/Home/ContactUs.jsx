"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "react-toastify";

export default function Subscribe() {
  const t = useTranslations("subscribe");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !postalCode) {
      toast.error("Please enter both email and postal code");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          postalCode,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(t("successMessage") || "Successfully subscribed!");
        setEmail("");
        setPostalCode("");
      } else {
        toast.error(data.error || t("errorMessage") || "Failed to subscribe");
      }
    } catch (error) {
      toast.error(t("errorMessage") || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-6 md:py-16 bg-[#8cc63c]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 max-w-[700px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3">
            {t("title")}
          </h2>
          <p className="text-base text-white">
            {t("subtitle")}
          </p>
        </div>
        
        <div className="max-w-[700px] mx-auto">
          <form onSubmit={handleSubmit}>
            {/* Input of Email & Postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 justify-center items-center gap-5">
              <input
                className="flex-1 
                  h-12 
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                disabled={loading}
              />
              <input
                className="flex-1 
                  h-12 
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
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={t("postalPlaceholder")}
                required
                disabled={loading}
              />
            </div>
            
            {/* Subscribe Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                mt-5
                p-3 text-[16px] font-bold
                rounded-[10px] 
                bg-white
                transition-colors
                shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
                w-full
                flex items-center justify-center gap-2
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100'}
              `}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8cc63c]"></div>
                  {t("subscribingText") || "Subscribing..."}
                </>
              ) : (
                t("buttonText")
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// import React from 'react';
// import { useTranslations } from "next-intl";

// export default function ContactUs() {
//   const t = useTranslations("contactUs");
  
//   return (
//     <section className="py-16 bg-[#8cc63c]" id='contact'>
//       <div className="container mx-auto px-4 max-w-3xl">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-bold text-white mb-3">
//             {t("title")}
//           </h2>
//           <p className="text-white/90">
//             {t("subtitle")}
//           </p>
//         </div>
        
//         {/* Contact Options */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Email */}
//           <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
//             <div className="w-12 h-12 mx-auto mb-4 bg-[#8cc63c]/10 rounded-full flex items-center justify-center">
//               <svg className="w-6 h-6 text-[#8cc63c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//               </svg>
//             </div>
//             <h3 className="font-semibold text-gray-900 mb-2">
//               {t("emailTitle")}
//             </h3>
//             <a 
//               href="mailto:support@prepcart.com" 
//               className="text-[#8cc63c] hover:text-[#7ab32f] font-medium"
//             >
//               support@prepcart.com
//             </a>
//           </div>

//           {/* Phone */}
//           <div className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
//             <div className="w-12 h-12 mx-auto mb-4 bg-[#8cc63c]/10 rounded-full flex items-center justify-center">
//               <svg className="w-6 h-6 text-[#8cc63c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//               </svg>
//             </div>
//             <h3 className="font-semibold text-gray-900 mb-2">
//               {t("phoneTitle")}
//             </h3>
//             <a 
//               href="tel:+1-800-PREPCART" 
//               className="text-[#8cc63c] hover:text-[#7ab32f] font-medium"
//             >
//               +1 (800) PREPCART
//             </a>
//           </div>
//         </div>
        
//         {/* Hours */}
//         <div className="mt-8 text-center">
//           <p className="text-white/90 text-sm">
//             {t("availabilityNote")}
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// }