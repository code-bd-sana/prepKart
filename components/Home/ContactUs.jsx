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
