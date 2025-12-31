"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  User,
  CreditCard,
  Info,
  Cookie,
  MapPin,
  Bell,
  CheckCircle,
  Lock,
  ArrowLeft,
  Brain,
  Globe,
  Scale,
  AlertTriangle,
  Download,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function LegalPage() {
  const params = useParams();
  const locale = params.locale;
  const legal = useTranslations("legal");
  const privacy = useTranslations("privacy");
  const [activeTab, setActiveTab] = useState("legal");

  const legalSections = [
    {
      id: "acceptance",
      icon: CheckCircle,
      title: legal("acceptanceTitle"),
      text: legal("acceptanceText"),
    },
    {
      id: "service",
      icon: FileText,
      title: legal("serviceTitle"),
      text: legal("serviceText"),
    },
    { id: "ai", icon: Brain, title: legal("aiTitle"), text: legal("aiText") },
    {
      id: "accounts",
      icon: User,
      title: legal("accountsTitle"),
      text: legal("accountsText"),
    },
    {
      id: "acceptableUse",
      icon: AlertTriangle,
      title: legal("acceptableUseTitle"),
      text: legal("acceptableUseText"),
    },
    { id: "ip", icon: Scale, title: legal("ipTitle"), text: legal("ipText") },
    {
      id: "data",
      icon: Lock,
      title: legal("dataTitle"),
      text: legal("dataText"),
    },
    {
      id: "subscription",
      icon: CreditCard,
      title: legal("subscriptionTitle"),
      text: legal("subscriptionText"),
    },
    {
      id: "refunds",
      icon: CreditCard,
      title: legal("refundsTitle"),
      text: legal("refundsText"),
    },
    {
      id: "thirdParty",
      icon: Globe,
      title: legal("thirdPartyTitle"),
      text: legal("thirdPartyText"),
    },
    {
      id: "pricing",
      icon: Info,
      title: legal("pricingTitle"),
      text: legal("pricingText"),
    },
    {
      id: "medical",
      icon: Shield,
      title: legal("medicalTitle"),
      text: legal("medicalText"),
    },
    {
      id: "availability",
      icon: Bell,
      title: legal("availabilityTitle"),
      text: legal("availabilityText"),
    },
    {
      id: "warranties",
      icon: Shield,
      title: legal("warrantiesTitle"),
      text: legal("warrantiesText"),
    },
    {
      id: "liability",
      icon: Shield,
      title: legal("liabilityTitle"),
      text: legal("liabilityText"),
    },
    {
      id: "indemnification",
      icon: Shield,
      title: legal("indemnificationTitle"),
      text: legal("indemnificationText"),
    },
    {
      id: "termination",
      icon: Lock,
      title: legal("terminationTitle"),
      text: legal("terminationText"),
    },
    {
      id: "outcomes",
      icon: Info,
      title: legal("outcomesTitle"),
      text: legal("outcomesText"),
    },
    {
      id: "children",
      icon: User,
      title: legal("childrenTitle"),
      text: legal("childrenText"),
    },
    {
      id: "dispute",
      icon: Scale,
      title: legal("disputeTitle"),
      text: legal("disputeText"),
    },
    {
      id: "changes",
      icon: Bell,
      title: legal("changesTitle"),
      text: legal("changesText"),
    },
    {
      id: "governing",
      icon: Globe,
      title: legal("governingTitle"),
      text: legal("governingText"),
    },
    {
      id: "legalContact",
      icon: Mail,
      title: legal("contactTitle"),
      text: legal("contactText"),
    },
  ];

  const privacySections = [
    {
      id: "accountability",
      icon: Shield,
      title: privacy("accountabilityTitle"),
      text: privacy("accountabilityText"),
    },
    {
      id: "collection",
      icon: User,
      title: privacy("collectionTitle"),
      text: privacy("collectionText"),
    },
    {
      id: "purposes",
      icon: FileText,
      title: privacy("purposesTitle"),
      text: privacy("purposesText"),
    },
    {
      id: "consent",
      icon: CheckCircle,
      title: privacy("consentTitle"),
      text: privacy("consentText"),
    },
    {
      id: "automated",
      icon: Brain,
      title: privacy("automatedTitle"),
      text: privacy("automatedText"),
    },
    {
      id: "cookies",
      icon: Cookie,
      title: privacy("cookiesTitle"),
      text: privacy("cookiesText"),
    },
    {
      id: "accuracy",
      icon: CheckCircle,
      title: privacy("accuracyTitle"),
      text: privacy("accuracyText"),
    },
    {
      id: "sharing",
      icon: Globe,
      title: privacy("sharingTitle"),
      text: privacy("sharingText"),
    },
    {
      id: "transfers",
      icon: MapPin,
      title: privacy("transfersTitle"),
      text: privacy("transfersText"),
    },
    {
      id: "retention",
      icon: Lock,
      title: privacy("retentionTitle"),
      text: privacy("retentionText"),
    },
    {
      id: "security",
      icon: Lock,
      title: privacy("securityTitle"),
      text: privacy("securityText"),
    },
    {
      id: "breach",
      icon: AlertTriangle,
      title: privacy("breachTitle"),
      text: privacy("breachText"),
    },
    {
      id: "rights",
      icon: Shield,
      title: privacy("rightsTitle"),
      text: privacy("rightsText"),
    },
    {
      id: "withdrawal",
      icon: Download,
      title: privacy("withdrawalTitle"),
      text: privacy("withdrawalText"),
    },
    {
      id: "updates",
      icon: Bell,
      title: privacy("updatesTitle"),
      text: privacy("updatesText"),
    },
    {
      id: "officer",
      icon: User,
      title: privacy("officerTitle"),
      text: privacy("officerText"),
    },
    {
      id: "privacyContact",
      icon: Mail,
      title: privacy("contactTitle"),
      text: privacy("contactText"),
    },
  ];

  const currentSections =
    activeTab === "legal" ? legalSections : privacySections;
  const currentTitle =
    activeTab === "legal" ? legal("title") : privacy("title");
  const currentUpdated =
    activeTab === "legal" ? legal("lastUpdated") : privacy("lastUpdated");
  const currentIntro =
    activeTab === "legal" ? legal("intro") : privacy("intro");

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal & Privacy
          </h1>
          <p className="text-gray-600 text-lg">
            Transparent policies for your peace of mind
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "legal"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {legal("title")}
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "privacy"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {privacy("title")}
            </button>
          </div>
        </div>

        {/* Content Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  activeTab === "legal" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {activeTab === "legal" ? (
                  <FileText className="w-5 h-5 text-green-600" />
                ) : (
                  <Shield className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {currentTitle}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{currentUpdated}</p>
              </div>
            </div>
          </div>

          <div
            className={`p-6 rounded-lg mb-8 ${
              activeTab === "legal"
                ? "bg-green-50 border border-green-100"
                : "bg-blue-50 border border-blue-100"
            }`}
          >
            <p className="text-gray-700 leading-relaxed">{currentIntro}</p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {currentSections.map((section) => {
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                className={`border rounded-lg p-6 transition-all hover:shadow-sm ${
                  activeTab === "legal"
                    ? "border-gray-200 hover:border-green-300"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-lg ${
                      activeTab === "legal"
                        ? "bg-green-50 text-green-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                      {section.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-full ${
                  activeTab === "legal" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <Info
                  className={`w-5 h-5 ${
                    activeTab === "legal" ? "text-green-600" : "text-blue-600"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Read the other policy:</p>
                <button
                  onClick={() =>
                    setActiveTab(activeTab === "legal" ? "privacy" : "legal")
                  }
                  className="text-sm font-medium text-green-700 hover:text-green-900 transition-colors"
                >
                  {activeTab === "legal" ? privacy("title") : legal("title")}
                </button>
              </div>
            </div>

            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue to Register
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              By using Prepcart, you agree to both our Legal Terms and Privacy
              Policy
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Contact: info@prepcart.ca
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
