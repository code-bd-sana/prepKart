import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import React from "react";
import ToastProvider from "@/components/ToastProvider";

export default function HomeLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        {children}
        <ToastProvider />
      </main>

      <Footer />
    </>
  );
}
