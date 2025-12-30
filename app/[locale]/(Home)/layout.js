"use client";

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
import dynamic from "next/dynamic";

export default function HomeLayout({ children }) {
  const CookieConsent = dynamic(() => import("@/components/CookieConsent"), {
    ssr: false,
  });

  const { user } = useSelector((state) => state.auth);
  const [cartData, setCartData] = useState({
    checkedCount: 0,
    listId: null,
    instacartLink: null,
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
          const stored = localStorage.getItem("prepcart_cart");
          if (stored) {
            const data = JSON.parse(stored);
            const isFresh = Date.now() - data.timestamp < 10 * 60 * 1000;

            if (isFresh) {
              setCartData({
                checkedCount: data.checkedCount || 0,
                listId: data.listId,
                instacartLink: data.instacartLink,
              });
            } else {
              localStorage.removeItem("prepcart_cart");
            }
          }
        } catch (error) {
          console.error("Error loading cart data:", error);
          localStorage.removeItem("prepcart_cart");
        }
        hasRestoredCartRef.current = true;
      }, 0);

      return () => clearTimeout(timer);
    }
  }, []);

  // Update cart data when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "prepcart_cart") {
        // Use setTimeout to avoid synchronous setState
        setTimeout(() => {
          try {
            if (e.newValue) {
              const data = JSON.parse(e.newValue);
              setCartData({
                checkedCount: data.checkedCount || 0,
                listId: data.listId,
                instacartLink: data.instacartLink,
              });
            } else {
              // If newValue is null, item was removed
              setCartData({
                checkedCount: 0,
                listId: null,
                instacartLink: null,
              });
            }
          } catch (error) {
            console.error("Error parsing cart data:", error);
          }
        }, 0);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Simple poll for same-tab updates (every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      // Skip polling if we haven't restored cart data yet
      if (!hasRestoredCartRef.current) return;

      try {
        const stored = localStorage.getItem("prepcart_cart");
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
                instacartLink: data.instacartLink,
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

  const handleCartClick = async () => {
    if (!user) {
      toast.info("Please login to use Instacart integration");
      return;
    }

    if (!cartData.listId) {
      toast.info("Please open a grocery list first");
      return;
    }

    if (cartData.checkedCount === 0) {
      toast.info(
        "Please select at least one item to add to your Instacart cart"
      );
      return;
    }

    try {
      // Show loading
      toast.loading("Generating Instacart cart...");

      // 1. Get current grocery list data
      const stored = localStorage.getItem("prepcart_cart");
      if (!stored) {
        throw new Error("No cart data found");
      }

      const cartData = JSON.parse(stored);

      // 2. Fetch the current grocery list to get updated items
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const response = await fetch(`/api/groceryLists/${cartData.listId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch grocery list");
      }

      const data = await response.json();
      const groceryList = data.groceryList;

      // 3. Filter checked items
      const checkedItems = groceryList.items.filter((item) => item.checked);

      if (checkedItems.length === 0) {
        toast.dismiss();
        toast.info("No items selected. Please select items first.");
        return;
      }

      // 4. Generate fresh Instacart link (this will track internally)
      const { generateInstacartLink } = await import("@/lib/instacart");
      const result = await generateInstacartLink(
        checkedItems,
        user?.tier || "free",
        process.env.INSTACART_IMPACT_ID,
        user?.id,
        cartData.listId
      );

      // REMOVED THE DUPLICATE TRACKING CALL HERE

      toast.dismiss();
      toast.success("Opening Instacart...");

      // 5. Open the fresh link
      setTimeout(() => {
        window.open(result.link, "_blank", "noopener,noreferrer");
      }, 500);
    } catch (error) {
      toast.dismiss();
      console.error("Error opening cart:", error);

      // Fallback to old link if available
      if (cartData.instacartLink) {
        toast.info("Opening saved Instacart link...");
        window.open(cartData.instacartLink, "_blank", "noopener,noreferrer");

        // Track fallback click (only once)
        trackInstacartClick({
          groceryListId: cartData.listId,
          userId: user?.id,
          userTier: user?.tier,
          checkedItemsCount: cartData.checkedCount,
          method: "fallback_cart_button",
          source: "floating_cart_fallback",
        });
      } else {
        toast.error("Failed to generate Instacart link");
      }
    }
  };

  // Update the cart button to always show when items are selected
  const isCartEnabled =
    user && cartData.checkedCount > 0 && cartData.instacartLink;
  return (
    <Providers className="relative min-h-screen">
      <Navbar />
      <main className="min-h-screen">
        {children}
        <ToastProvider />
        <CookieConsent />
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
            ${
              isCartEnabled
                ? "bg-linear-to-br from-[#8cc63c] to-[#7ab32f] shadow-green-500/30 hover:shadow-green-500/40 animate-bounce hover:animate-none cursor-pointer"
                : "bg-gray-400 shadow-gray-400/30 hover:shadow-gray-400/40 cursor-not-allowed"
            }
          `}
          disabled={!isCartEnabled}
        >
          <FaShoppingCart className="w-6 h-6 text-white" />

          {cartData.checkedCount > 0 && user ? (
            <div
              className="
              absolute -top-2 -right-2
              flex items-center justify-center
              w-6 h-6
              bg-red-500
              text-white
              text-xs
              font-bold
              rounded-full
              border-2 border-white
            "
            >
              {cartData.checkedCount}
            </div>
          ) : null}

          <div
            className="
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
  "
          >
            {!user
              ? "Please login"
              : !cartData.listId
              ? "Open grocery list"
              : cartData.checkedCount === 0
              ? "Select items first"
              : `Order ${cartData.checkedCount} items on Instacart`}
          </div>
        </button>
      </div>
    </Providers>
  );
}
