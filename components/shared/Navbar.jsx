"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl"; // Add this

export default function Navbar() {
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("navbar");

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const createLocalizedPath = (newLocale) => {
    if (!pathname) return `/${newLocale}`;

    const segments = pathname.split("/").filter(Boolean);
    const currentLocale = segments[0];

    if (!["en", "fr"].includes(currentLocale)) {
      return `/${newLocale}${pathname}`;
    }

    return `/${newLocale}${pathname.slice(currentLocale.length + 1) || "/"}`;
  };

  const currentLocale = pathname?.split("/")[1] || "en";

  // Update navItems to use translations
  const navItems = [
    { label: t("home"), href: `/${locale}` }, // Add locale to home
    { label: t("howItWorks"), href: "#howitworks" },
    { label: t("pricing"), href: "#pricing" },
    // { label: t("recipes"), href: "#recipes" },
    { label: t("partners"), href: "#partners" },
    { label: t("faq"), href: "#faq" },
  ];

  // Handle hash changes (keep this as is)
  useEffect(() => {
    const getCurrentHash = () => {
      if (typeof window !== "undefined") {
        return window.location.hash;
      }
      return "";
    };

    const timeoutId = setTimeout(() => {
      setActiveHash(getCurrentHash());
    }, 0);

    const handleHashChange = () => {
      setActiveHash(getCurrentHash());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
    toast.success(t("loggedOut"));
    router.push(`/${locale}`); // Add locale to redirect
  };

  // to determine if an item is active
  const isItemActive = (itemHref) => {
    // For Home page - check with locale
    if (itemHref === `/${locale}`) {
      return pathname === `/${locale}` && !activeHash;
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
      setActiveHash(href);
      setOpen(false);
    } else {
      setActiveHash("");
      setOpen(false);
    }
  };

  // Show loading state while auth is being restored
  if (loading) {
    return (
      <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="h-16 flex items-center justify-between max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="w-32 lg:w-40 xl:w-44 h-8 bg-gray-200 animate-pulse rounded"></div>
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
      <div className="hidden md:flex items-center justify-between max-w-[1600px] mx-auto py-2 px-4 md:px-8">
        {/* LEFT */}
        <div className="flex items-center justify-between gap-x-8 md:gap-x-16">
          {/* LOGO - Add locale */}
          <Link href={`/${locale}`} onClick={() => setActiveHash("")}>
            <Image
              src="/logo1.png"
              alt="logo"
              width={180}
              height={0}
              className="cursor-pointer w-32 lg:w-40 xl:w-44 h-auto"
              priority
            />
          </Link>
        </div>
        <div>
          {/* MENU */}
          <div className="flex items-center font-medium gap-4 md:gap-6 text-sm md:text-[15px]">
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
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#4a9fd8]"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 lg:gap-4 xl:gap-6">
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
              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setActiveHash("")}
              >
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#4a9fd8] hover:bg-[#3b8ec4] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  {t("dashboard")}
                </button>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-red-500 hover:bg-red-600 transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link href={`/${locale}/login`} onClick={() => setActiveHash("")}>
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-[#4a9fd8] font-medium rounded-md border-2 border-[#4a9fd8] hover:bg-blue-50 transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  {t("login")}
                </button>
              </Link>

              {/* Register Button */}
              <Link
                href={`/${locale}/register`}
                onClick={() => setActiveHash("")}
              >
                <button className="px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-white font-medium rounded-md bg-[#8cc63c] hover:bg-[#7ab32f] transition-colors duration-200 cursor-pointer text-sm lg:text-base whitespace-nowrap">
                  {t("getStarted")}
                </button>
              </Link>
            </>
          )}
        </div>
        <div className="flex gap-x-2">
          <Link
            href={createLocalizedPath("en")}
            className={currentLocale === "en" ? "font-bold" : ""}
          >
            EN
          </Link>
          <Link
            href={createLocalizedPath("fr")}
            className={currentLocale === "fr" ? "font-bold" : ""}
          >
            FR
          </Link>
        </div>
        </div>
      </div>
      

      {/* ---------------- MOBILE NAV ---------------- */}
      <div className="lg:hidden px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
        {/* LEFT SIDE LOGO */}
        <Link href={`/${locale}`} onClick={() => setActiveHash("")}>
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
                  href={`/${locale}/dashboard`}
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-[#4a9fd8] cursor-pointer text-sm sm:text-base">
                    {t("dashboard")}
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-red-500 cursor-pointer text-sm sm:text-base"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-[#4a9fd8] font-medium rounded-md border-2 border-[#4a9fd8] cursor-pointer text-sm sm:text-base">
                    {t("login")}
                  </button>
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => {
                    setActiveHash("");
                    setOpen(false);
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 sm:px-5 py-2.5 text-white font-medium rounded-md bg-[#8cc63c] cursor-pointer text-sm sm:text-base">
                    {t("getStarted")}
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
