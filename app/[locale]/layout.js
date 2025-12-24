"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";
import Providers from "../providers";
import ToastProvider from "@/components/ToastProvider";

const validLocales = ["en", "fr"];

export default function RootLayout({ children, params }) {
  const [locale, setLocale] = useState("en");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params;
        const newLocale = unwrappedParams?.locale;

        // Validate locale
        if (!newLocale || !validLocales.includes(newLocale)) {
          console.error("Invalid locale detected:", newLocale);
          // Redirect to default locale or handle error
          router.replace("/en");
          return;
        }

        setLocale(newLocale);
      } catch (error) {
        console.error("Error unwrapping params:", error);
        setLocale("en");
      }
    };

    unwrapParams();
  }, [params, router]);

  // Select messages based on locale
  const messages = locale === "fr" ? frMessages : enMessages;

  // Function to create language-switched URL
  const createLocalizedPath = (newLocale) => {
    if (!pathname) return `/${newLocale}`;

    // Extract the current locale
    const segments = pathname.split("/").filter(Boolean);
    const currentLocale = segments[0];

    if (!["en", "fr"].includes(currentLocale)) {
      return `/${newLocale}${pathname}`;
    }

    return `/${newLocale}${pathname.slice(currentLocale.length + 1) || "/"}`;
  };

  // Early return if locale is invalid
  if (!validLocales.includes(locale)) {
    return (
      <html lang="en">
        <body>
          <div>Loading...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang={locale}>
      <head>
        <title>Prepcart</title>
        <meta name="description" content="AI Meal Planning for Canadians" />
      </head>
      <body>
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <ToastProvider />
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
