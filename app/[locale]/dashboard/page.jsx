"use client";

import { useSelector } from "react-redux";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useSelector((state) => state.auth);
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("dashboard");

  // Tier configuration
  const tierConfig = {
    free: {
      name: t("freePlan"),
      color: "bg-[#EDF7E0] text-black",
      price: t("freePrice"),
      swapsAllowed: 1,
      features: ["1 swap per plan", "Basic recipes", "Limited saves"],
    },
    tier2: {
      name: t("plusPlan"),
      color: "bg-[#D9ECF9] text-black",
      price: t("plusPrice"),
      swapsAllowed: 2,
      features: ["2 swaps per plan", "Edamam recipes", "Unlimited saves"],
    },
    tier3: {
      name: t("premiumPlan"),
      color: "bg-black text-white",
      price: t("premiumPrice"),
      swapsAllowed: 3,
      features: ["3 swaps per plan", "Premium recipes", "Priority support"],
    },
  };

  const currentTier = user?.tier || "free";
  const config = tierConfig[currentTier];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8cc63c] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Format date based on locale
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return date.toLocaleDateString(
      locale === "fr" ? "fr-CA" : "en-CA",
      options
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 bg-[#8cc63c] hover:bg-[#7ab32f]  text-white px-5 py-2.5 rounded-lg font-medium"
            >
              <ArrowLeft />
              {t("backToHome")}
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {t("welcome")}
                {user?.name ? `, ${user.name}` : ""}! 👋
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {t("accountOverview")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("emailAddress")}</p>
                    <p className="font-medium truncate">
                      {user?.email || t("notAvailable")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("location")}</p>
                    <p className="font-medium">
                      {user?.province || t("notSet")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("accountCreated")}
                    </p>
                    <p className="font-medium">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("subscriptionStatus")}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`font-medium px-3 py-1 rounded-full text-sm ${config.color}`}
                      >
                        {config.name} {t("yourPlan").split(" ")[1]}{" "}
                        {/* Shows "Plan" */}
                      </span>
                      <span className="text-sm text-gray-500">
                        {config.price}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      {t("swapsAvailable")}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {user?.swapsUsed || 0} /{" "}
                        {user?.swapsAllowed || config.swapsAllowed} {t("used")}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#8cc63c] h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((user?.swapsUsed || 0) /
                                (user?.swapsAllowed || config.swapsAllowed)) *
                                100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Plan Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {t("yourPlan")}
              </h2>

              <div className={`p-4 rounded-lg ${config.color} mb-4`}>
                <div className="font-bold text-lg">
                  {config.name} {t("yourPlan").split(" ")[1]}
                </div>
                <div className="text-sm opacity-90">{config.price}</div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/${locale}/#pricing`}
                  className="block w-full text-center bg-[#8cc63c] hover:bg-[#7ab32f] text-white py-3 rounded-lg font-medium"
                >
                  {currentTier === "free"
                    ? t("upgradePlan")
                    : t("manageSubscription")}
                </Link>
                {user?.tier !== "free" && (
                  <Link
                    href={`/${locale}/pantry`}
                    className="flex items-center gap-2 text-green-600 hover:text-green-800"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Pantry
                  </Link>
                )}
                {/* {currentTier !== 'free' && (
                  <Link
                    href={`/${locale}/#pricing`}
                    className="block w-full text-center border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50 font-medium"
                  >
                    {t('cancelSubscription')}
                  </Link>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
