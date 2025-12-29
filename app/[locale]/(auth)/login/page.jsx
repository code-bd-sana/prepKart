"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "@/store/slices/authSlice";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("login");
  const params = useParams();
  const locale = params.locale;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success("Successfully Logged In!");

      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      toast.error("Login Failed");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail, locale: locale })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password reset link sent to your email!");
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        toast.error(data.error || "Failed to send reset link");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-50 to-green-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Home Button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft />
            {t("backToHome")}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-[#ebf2f7] to-[#dae2e9] px-6 py-8 text-center">
            <h1 className="text-2xl font-bold mb-1"> {t("title")}</h1>
            <p className="text-sm text-[#8cc63c]">{t("subtitle")}</p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r text-sm">
                <p className="font-medium">
                  {error.includes("401") ? "Invalid email or password" : error}
                </p>
              </div>
            )}

            {showForgotPassword ? (
              // Forgot Password Form
              <div className="space-y-4">
                <div className="mb-4">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Login
                  </button>
                </div>

                <h2 className="text-lg font-semibold text-gray-800 mb-2">Reset Your Password</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we have sent you a link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none transition"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className={`w-full py-3 px-4 rounded-md text-sm font-semibold shadow-sm transition ${forgotPasswordLoading
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-[#4a9fd8] hover:bg-[#3a8ec8] text-white hover:shadow-md"
                      }`}
                  >
                    {forgotPasswordLoading ? "Sending Reset Link..." : "Send Reset Link"}
                  </button>
                </form>
              </div>
            ) : (
              // Login Form
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none transition"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700">
                        {t("password")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-[#4a9fd8] hover:text-[#3a8ec8] font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none transition pr-10"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3 px-4 rounded-md text-sm font-semibold shadow-sm transition ${loading
                          ? "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-[#8cc63c] hover:bg-[#7ab32f] text-white hover:shadow-md"
                        }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          {t("loggingIn")}
                        </span>
                      ) : (
                        t("loginButton")
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {t("noAccount")}{" "}
                      <Link
                        href={`/${locale}/register`}
                        className="text-[#8cc63c] hover:text-[#7ab32f] font-semibold"
                      >
                        {t("createAccount")}
                      </Link>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}