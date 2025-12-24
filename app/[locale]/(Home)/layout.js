'use client';

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import React, { useState, useEffect, useRef } from "react";
import ToastProvider from "@/components/ToastProvider";
import Providers from "@/app/providers";
import { FaShoppingCart } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { trackInstacartClick } from "@/lib/instacart";
import { usePathname } from "next/navigation";

export default function HomeLayout({ children }) {
  const { user } = useSelector((state) => state.auth);
  const [cartData, setCartData] = useState({
    checkedCount: 0,
    listId: null,
    instacartLink: null
  });
  const pathname = usePathname();
  const initialLoadRef = useRef(true);
  const hasRestoredCartRef = useRef(false); // Track if we've restored cart data

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        try {
          const stored = localStorage.getItem('prepcart_cart');
          if (stored) {
            const data = JSON.parse(stored);
            const isFresh = Date.now() - data.timestamp < 10 * 60 * 1000;
            
            if (isFresh) {
              setCartData({
                checkedCount: data.checkedCount || 0,
                listId: data.listId,
                instacartLink: data.instacartLink
              });
            } else {
              localStorage.removeItem('prepcart_cart');
            }
          }
        } catch (error) {
          console.error('Error loading cart data:', error);
          localStorage.removeItem('prepcart_cart');
        }
        hasRestoredCartRef.current = true;
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Update cart data when localStorage changes 
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'prepcart_cart') {
        // Use setTimeout to avoid synchronous setState
        setTimeout(() => {
          try {
            if (e.newValue) {
              const data = JSON.parse(e.newValue);
              setCartData({
                checkedCount: data.checkedCount || 0,
                listId: data.listId,
                instacartLink: data.instacartLink
              });
            } else {
              // If newValue is null, item was removed
              setCartData({ checkedCount: 0, listId: null, instacartLink: null });
            }
          } catch (error) {
            console.error('Error parsing cart data:', error);
          }
        }, 0);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Simple poll for same-tab updates (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip polling if we haven't restored cart data yet
      if (!hasRestoredCartRef.current) return;
      
      try {
        const stored = localStorage.getItem('prepcart_cart');
        if (stored) {
          const data = JSON.parse(stored);
          // Check if data is different from current state
          if (
            data.checkedCount !== cartData.checkedCount ||
            data.listId !== cartData.listId ||
            data.instacartLink !== cartData.instacartLink
          ) {
            // Use setTimeout to avoid synchronous setState
            setTimeout(() => {
              setCartData({
                checkedCount: data.checkedCount || 0,
                listId: data.listId,
                instacartLink: data.instacartLink
              });
            }, 0);
          }
        } else if (cartData.checkedCount > 0 || cartData.listId) {
          // localStorage was cleared but state still has data
          setTimeout(() => {
            setCartData({ checkedCount: 0, listId: null, instacartLink: null });
          }, 0);
        }
      } catch (error) {
        // Silently handle errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cartData]);

  // Handle cart button click
  const handleCartClick = () => {
    if (!user) {
      toast.info("Please login to use Instacart integration");
      return;
    }

    if (!cartData.listId) {
      toast.info("Please open a grocery list first");
      return;
    }

    if (user?.tier !== "tier3") {
      toast.info("Upgrade to Premium to access Instacart integration");
      return;
    }

    if (cartData.checkedCount === 0) {
      toast.info("Please select at least one item to add to your Instacart cart");
      return;
    }

    if (!cartData.instacartLink) {
      toast.error("Instacart link not available. Please try refreshing the page.");
      return;
    }

    // Track click
    trackInstacartClick({
      groceryListId: cartData.listId,
      userId: user?.id,
      userTier: user?.tier,
      checkedItemsCount: cartData.checkedCount,
    });

    // Open Instacart link
    window.open(cartData.instacartLink, "_blank");
  };

  // Check if cart button should be enabled
  const isCartEnabled = user && cartData.checkedCount > 0 && user?.tier === "tier3" && cartData.instacartLink;

  return (
    <Providers className="relative min-h-screen"> 
      <Navbar />
      <main className="min-h-screen">
        {children}
        <ToastProvider />
      </main>
      <Footer />
      
      {/* Animated Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={handleCartClick}
          className={`
            relative
            group
            w-14 h-14
            flex items-center justify-center
            rounded-full
            shadow-lg
            hover:shadow-xl
            hover:scale-105
            active:scale-95
            transition-all duration-300
            ${isCartEnabled
              ? "bg-linear-to-br from-[#8cc63c] to-[#7ab32f] shadow-green-500/30 hover:shadow-green-500/40 animate-bounce hover:animate-none cursor-pointer" 
              : "bg-gray-400 shadow-gray-400/30 hover:shadow-gray-400/40 cursor-not-allowed"
            }
          `}
          disabled={!isCartEnabled}
        >
          <FaShoppingCart className="w-6 h-6 text-white" />
          
          {cartData.checkedCount > 0 && user ? (
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
              {cartData.checkedCount}
            </div>
          ) : null}
          
          <div className="
            absolute right-full mr-3 top-1/2 -translate-y-1/2
            px-3 py-1.5
            bg-gray-800
            text-white text-xs
            rounded
            whitespace-nowrap
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            pointer-events-none
            hidden md:block
          ">
            {!user ? "Please login" :
             !cartData.listId ? "Open grocery list" :
             user?.tier !== "tier3" ? "Upgrade for Instacart" :
             cartData.checkedCount === 0 ? "Select items first" :
             !cartData.instacartLink ? "Link unavailable" :
             `Order ${cartData.checkedCount} items`}
          </div>
        </button>
      </div>
    </Providers>
  );
}