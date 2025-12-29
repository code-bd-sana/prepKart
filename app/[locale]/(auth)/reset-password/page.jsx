"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = params.locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const t = useTranslations("auth");

  // Verify token on page load
  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link.");
      setTimeout(() => router.push(`/${locale}/login`), 2000);
      return;
    }

    const verifyToken = async () => {
      setVerifying(true);
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setTokenValid(true);
          setUserEmail(data.email);
          toast.success("Token verified. Enter your new password.");
        } else {
          toast.error(data.error || "Invalid or expired reset link");
          setTimeout(() => router.push(`/${locale}/login`), 3000);
        }
      } catch (error) {
        toast.error("Failed to verify reset link.");
        setTimeout(() => router.push(`/${locale}/login`), 3000);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, router, locale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tokenValid) {
      toast.error("Invalid reset token");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, locale: locale })
      });

      const data = await response.json();
      
      if (data.success) {
        setResetSuccess(true);
        toast.success("Password reset successfully!");
        
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-red-500 mb-4">
              <Lock className="w-16 h-16 mx-auto text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">The password reset link is invalid.</p>
            <Link
              href={`/${locale}/login`}
              className="inline-block text-[#4a9fd8] hover:text-[#3a8ec8] font-medium"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              You can now login with your new password.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Redirecting to login...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-50 to-green-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="mb-4">
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-[#ebf2f7] to-[#dae2e9] px-6 py-8 text-center">
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-[#4a9fd8]" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Reset Your Password</h1>
            <p className="text-sm text-[#8cc63c]">
              {userEmail ? `Reset password for ${userEmail}` : "Set a new password"}
            </p>
          </div>

          <div className="px-6 py-6">
            {verifying ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a9fd8] mx-auto mb-4"></div>
                <p className="text-gray-600">Verifying reset link...</p>
              </div>
            ) : !tokenValid ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">❌</div>
                <p className="text-gray-600">Invalid or expired reset link</p>
                <Link
                  href={`/${locale}/login`}
                  className="mt-4 inline-block text-[#4a9fd8] hover:text-[#3a8ec8] font-medium"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none transition pr-10"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none transition pr-10"
                      placeholder="Confirm your new password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || password.length < 6 || password !== confirmPassword}
                    className={`w-full py-3 px-4 rounded-md text-sm font-semibold shadow-sm transition ${
                      loading || password.length < 6 || password !== confirmPassword
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-[#8cc63c] hover:bg-[#7ab32f] text-white hover:shadow-md"
                    }`}
                  >
                    {loading ? "Resetting Password..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}