"use client";

import { usePathname } from "next/navigation";
import { FaHome, FaBlog, FaUsers, FaSignOutAlt } from "react-icons/fa";
import Link from "next/link";
import ToastProvider from "@/components/ToastProvider";

export default function AdminLayout({ children }) {
  
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = `/${locale}/login`;
  };

  // Design Needed for mobile also  ==============================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full  bg-gray-900 text-white shadow-lg">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href={`/${locale}/admin`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
          >
            <FaHome /> Dashboard
          </Link>
          <Link
            href={`/${locale}/admin/blog`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
          >
            <FaBlog /> Blog Posts
          </Link>
          <Link
            href={`/${locale}/admin/users`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition"
          >
            <FaUsers /> Users
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Link
              href={`/${locale}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition w-full text-white hover:text-gray-300"
            >
              ← Back to Home
            </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition w-full text-red-400 hover:text-red-300"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="">
        {children}
        <ToastProvider />
      </div>
    </div>
  );
}
