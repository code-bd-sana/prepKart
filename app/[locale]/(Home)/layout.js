'use client';

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import React from "react";
import ToastProvider from "@/components/ToastProvider";
import Providers from "@/app/providers";
import { FaShoppingCart } from "react-icons/fa";

export default function HomeLayout({ children }) {
  const cartCount = 3; 
  return (
    <Providers className="relative min-h-screen"> 
      <Navbar />
      <main className="min-h-screen">
        {children}
        <ToastProvider />
      </main>
      <Footer />
      
      {/* Simple Animated Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="
          relative
          group
          w-14 h-14
          flex items-center justify-center
          bg-linear-to-br from-[#8cc63c] to-[#7ab32f]
          rounded-full
          shadow-lg
          shadow-green-500/30
          hover:shadow-xl
          hover:shadow-green-500/40
          hover:scale-105
          active:scale-95
          cursor-pointer
          transition-all duration-300
          animate-bounce
          hover:animate-none
        ">
          {/* Cart Icon - NO ROTATION */}
          <FaShoppingCart className="w-6 h-6 text-white" />
          
          {/* Cart Count Badge */}
          <div className="
            absolute -top-2 -right-2
            flex items-center justify-center
            w-6 h-6
            bg-red-500
            text-white
            text-xs
            font-bold
            rounded-full
            border-2 border-white
          ">
            {cartCount}
          </div>
          
          {/* Simple Tooltip */}
          <div className="
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-3 py-1.5
            bg-gray-800
            text-white text-xs
            rounded
            whitespace-nowrap
            opacity-0 group-hover:opacity-100
             duration-300
            pointer-events-none
            hidden md:block
          ">
            Cart ({cartCount} items)
          </div>
        </button>
      </div>
    </Providers>
  );
}