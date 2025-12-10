"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FiMenu, FiMessageCircle, FiX } from "react-icons/fi";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/#howitworks" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Recipes", href: "/#recipes" },
    { label: "Partners", href: "/#partners" },
    { label: "Admin", href: "/admin" },
  ];
  

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* ---------------- DESKTOP NAV ---------------- */}
      <div className="hidden lg:flex w-full items-center justify-between max-w-[1500px] mx-auto  py-2">
        {/* LEFT */}
        <div className="flex items-center gap-x-8 lg:gap-x-16 xl:gap-x-72">
          {/* LOGO */}
          <Link href="/">
            <Image
              src="/logo1.png"
              alt="logo"
              width={180}
              height={0}
              className="cursor-pointer w-32 lg:w-40 xl:w-44 h-auto"
            />
          </Link>

          {/* MENU */}
          <div className="flex items-center font-medium gap-4 lg:gap-6 xl:gap-8 text-sm lg:text-[15px]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative transition font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#4a9fd8]"
                      : "text-black hover:text-[#4a9fd8]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
          {/* BUTTON */}
         <Link href="/">
  <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#4a9fd8] hover:bg-[#3b8ec4] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
    Dashboard
  </button>
</Link>

<button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#8cc63c] hover:bg-[#7ab32f] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
  Generate Plan
</button>

        </div>
      </div>

      {/* ---------------- MOBILE NAV ---------------- */}
      <div className="lg:hidden px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
        {/* LEFT SIDE LOGO */}
        <Image
          src="/logo1.png"
          alt="logo"
          width={150}
          height={0}
          className="cursor-pointer w-28 sm:w-36 md:w-40 h-auto"
        />

        {/* MENU BUTTON */}
        <div className="flex items-center gap-4">
          {/* Hamburger */}
          {open ? (
            <FiX
              className="text-2xl sm:text-[26px] cursor-pointer"
              onClick={() => setOpen(false)}
            />
          ) : (
            <FiMenu
              className="text-2xl sm:text-[26px] cursor-pointer"
              onClick={() => setOpen(true)}
            />
          )}
        </div>
      </div>

      {/* ---------------- MOBILE MENU DROPDOWN ---------------- */}
      {open && (
        <div className="lg:hidden bg-white px-4 sm:px-6 md:px-8 pb-5 border-t animate-slideDown">
          {/* MENU ITEMS */}
          <div className="flex flex-col gap-3 sm:gap-4 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm sm:text-[15px] font-medium ${
                    isActive
                      ? "text-[#4a9fd8]"
                      : "text-black hover:text-[#4a9fd8]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* MESSAGE ICON */}
          <div className="flex flex-col sm:flex-row mt-4 items-stretch sm:items-center gap-3 sm:gap-4">
            <Link href="/" className="flex-1">
              <button className="w-full px-4 sm:px-5 py-2.5 text-[#4a9fd8] font-medium rounded-md border-2 border-[#4a9fd8] cursor-pointer text-sm sm:text-base">
                Dashboard
              </button>
            </Link>
            <button className="flex-1 px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-[#8cc63c] cursor-pointer text-sm sm:text-base">
              Generate Plan
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}