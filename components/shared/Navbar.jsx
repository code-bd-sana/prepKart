"use client";
import { useState, useEffect } from "react"; 
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(""); 
  
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  // Handle hash changes
  useEffect(() => {
  // to get current hash
  const getCurrentHash = () => {
    if (typeof window !== "undefined") {
      return window.location.hash;
    }
    return "";
  };

  // to defer the state update
  const timeoutId = setTimeout(() => {
    setActiveHash(getCurrentHash());
  }, 0);

  // Handle hash changes
  const handleHashChange = () => {
    setActiveHash(getCurrentHash());
  };

  // Listen to hash changes
  window.addEventListener("hashchange", handleHashChange);

  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener("hashchange", handleHashChange);
  };
}, []);

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    router.push("/");
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "#howitworks" },
    { label: "Pricing", href: "#pricing" },
    { label: "Recipes", href: "#recipes" },
    { label: "Partners", href: "#partners" },
    { label: "FAQ", href: "#faq" },
  ];

  // to determine if an item is active
  const isItemActive = (itemHref) => {
    // For Home page
    if (itemHref === "/") {
      return pathname === "/" && !activeHash;
    }
    
    // For hash links
    if (itemHref.startsWith("#")) {
      return activeHash === itemHref;
    }
    
    // For regular paths 
    return pathname === itemHref;
  };

  // Handle nav item clicks for hash links
  const handleNavClick = (href) => {
    if (href.startsWith("#")) {
      // For hash links, update the activeHash state
      setActiveHash(href);
      setOpen(false); // Close mobile menu if open
    } else {
      // For regular links, reset hash
      setActiveHash("");
      setOpen(false);
    }
  };

  // Show loading state while auth is being restored
  if (loading) {
    return (
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="h-16 flex items-center justify-between max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Logo skeleton */}
          <div className="w-32 lg:w-40 xl:w-44 h-8 bg-gray-200 animate-pulse rounded"></div>
          {/* Auth buttons skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      {/* ---------------- DESKTOP NAV ---------------- */}
      <div className="hidden lg:flex w-full items-center justify-between max-w-[1500px] mx-auto py-2 px-4 sm:px-6 md:px-8">
        {/* LEFT */}
        <div className="flex items-center gap-x-8 lg:gap-x-16 xl:gap-x-72">
          {/* LOGO */}
          <Link href="/" onClick={() => setActiveHash("")}>
            <Image
              src="/logo1.png"
              alt="logo"
              width={180}
              height={0}
              className="cursor-pointer w-32 lg:w-40 xl:w-44 h-auto"
              priority
            />
          </Link>

          {/* MENU */}
          <div className="flex items-center font-medium gap-4 lg:gap-6 xl:gap-8 text-sm lg:text-[15px]">
            {navItems.map((item) => {
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`relative transition font-medium whitespace-nowrap ${
                    isActive
                      ? "text-[#4a9fd8]"
                      : "text-black hover:text-[#4a9fd8]"
                  }`}
                >
                  {item.label}
                  {/* Optional: Add underline for active item */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#4a9fd8]"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
          {/* Show user info if logged in, otherwise show auth buttons */}
          {user ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-800 font-medium text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-gray-700 hidden md:block">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </div>

              {/* Dashboard Button */}
              <Link href="/dashboard" onClick={() => setActiveHash("")}>
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#4a9fd8] hover:bg-[#3b8ec4] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  Dashboard
                </button>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-red-500 hover:bg-red-600 transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link href="/login" onClick={() => setActiveHash("")}>
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-[#4a9fd8] font-medium rounded-md border-2 border-[#4a9fd8] hover:bg-blue-50 transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  Login
                </button>
              </Link>

              {/* Register Button */}
              <Link href="/register" onClick={() => setActiveHash("")}>
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#8cc63c] hover:bg-[#7ab32f] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ---------------- MOBILE NAV ---------------- */}
      <div className="lg:hidden px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
        {/* LEFT SIDE LOGO */}
        <Link href="/" onClick={() => setActiveHash("")}>
          <Image
            src="/logo1.png"
            alt="logo"
            width={150}
            height={0}
            className="cursor-pointer w-28 sm:w-36 md:w-40 h-auto"
            priority
          />
        </Link>

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
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`text-sm sm:text-[15px] font-medium ${
                    isActive
                      ? "text-[#4a9fd8]"
                      : "text-black hover:text-[#4a9fd8]"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#4a9fd8]"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col sm:flex-row mt-4 items-stretch sm:items-center gap-3 sm:gap-4">
            {user ? (
              <>
                {/* User Info for Mobile */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-800 font-medium text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-[#4a9fd8] cursor-pointer text-sm sm:text-base">
                    Dashboard
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-red-500 cursor-pointer text-sm sm:text-base"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-[#4a9fd8] font-medium rounded-md border-2 border-[#4a9fd8] cursor-pointer text-sm sm:text-base">
                    Login
                  </button>
                </Link>
                <Link
                  href="/register"
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-[#8cc63c] cursor-pointer text-sm sm:text-base">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}