"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "@/store/slices/authSlice";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

// PROVINCES in both languages
const PROVINCES_EN = [
  "Ontario",
  "Quebec",
  "British Columbia",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Prince Edward Island",
];

const PROVINCES_FR = [
  "Ontario",
  "Québec",
  "Colombie-Britannique",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Nouvelle-Écosse",
  "Nouveau-Brunswick",
  "Terre-Neuve-et-Labrador",
  "Île-du-Prince-Édouard",
];

// Dietary preferences for checkboxes
const DIETARY_OPTIONS = [
  "Halal",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
  "Low-Carb",
  "Low-Fat",
  "Mediterranean",
];

// Common allergies
const ALLERGY_OPTIONS = [
  "Eggs",
  "Milk",
  "Mustard",
  "Peanuts",
  "Crustaceans and molluscs",
  "Fish",
  "Sesame seeds",
  "Soy",
  "Sulphites",
  "Tree Nuts",
  "Wheat and triticale",
  "Gluten",
];

export default function RegisterPage() {
  const params = useParams();
  const locale = params.locale;
  const t = useTranslations("register");

  // Get provinces based on locale
  const PROVINCES = locale === "fr" ? PROVINCES_FR : PROVINCES_EN;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    province: "Ontario",
    ageVerified: false,
    dietaryPreferences: [],
    allergies: [],
    likes: [],
    dislikes: [],
    cookingMethod: [],
    skillLevel: "beginner",
    maxCookingTime: 60,
    goal: "general_health",
    budgetLevel: "medium",
    marketing_consent: false,
    age: "",
    agreeTerms: false,
  });

  const [likesText, setLikesText] = useState("");
  const [dislikesText, setDislikesText] = useState("");
  const [customDietary, setCustomDietary] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");

  // validation function
  const isFormValid = () => {
    // Check required fields
    if (!formData.name.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!formData.password || formData.password.length < 6) return false;
    if (!formData.province) return false;

    // Check checkboxes
    if (!formData.ageVerified) return false;
    if (!formData.agreeTerms) return false;
    if (!formData.marketing_consent) return false;

    return true;
  };

  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (
        name === "ageVerified" ||
        name === "marketing_consent" ||
        name === "agreeTerms"
      ) {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addDietaryPreference = (pref) => {
    if (pref && !formData.dietaryPreferences.includes(pref)) {
      setFormData((prev) => ({
        ...prev,
        dietaryPreferences: [...prev.dietaryPreferences, pref],
      }));
    }
  };

  const removeDietaryPreference = (pref) => {
    setFormData((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.filter((d) => d !== pref),
    }));
  };

  const addAllergy = (allergy) => {
    if (allergy && !formData.allergies.includes(allergy)) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergy],
      }));
    }
  };

  const removeAllergy = (allergy) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a) => a !== allergy),
    }));
  };

  const handleDietarySelect = (e) => {
    const value = e.target.value;
    if (value && value !== "") {
      addDietaryPreference(value);
      e.target.value = "";
    }
  };

  const handleAllergySelect = (e) => {
    const value = e.target.value;
    if (value && value !== "") {
      addAllergy(value);
      e.target.value = "";
    }
  };

  const handleCustomDietary = (e) => {
    e.preventDefault();
    if (customDietary.trim()) {
      addDietaryPreference(customDietary.trim());
      setCustomDietary("");
    }
  };

  const handleCustomAllergy = (e) => {
    e.preventDefault();
    if (customAllergy.trim()) {
      addAllergy(customAllergy.trim());
      setCustomAllergy("");
    }
  };

  const handleLikesBlur = () => {
    if (likesText.trim()) {
      const likesArray = likesText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      setFormData((prev) => ({
        ...prev,
        likes: [...prev.likes, ...likesArray],
      }));
      setLikesText("");
    }
  };

  const handleDislikesBlur = () => {
    if (dislikesText.trim()) {
      const dislikesArray = dislikesText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item);
      setFormData((prev) => ({
        ...prev,
        dislikes: [...prev.dislikes, ...dislikesArray],
      }));
      setDislikesText("");
    }
  };

  const removeLike = (index) => {
    setFormData((prev) => ({
      ...prev,
      likes: prev.likes.filter((_, i) => i !== index),
    }));
  };

  const removeDislike = (index) => {
    setFormData((prev) => ({
      ...prev,
      dislikes: prev.dislikes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!isFormValid()) {
      const missingFields = [];
      if (!formData.name.trim()) missingFields.push("Name");
      if (!formData.email.trim()) missingFields.push("Email");
      if (!formData.password || formData.password.length < 6)
        missingFields.push("Password");
      if (!formData.province) missingFields.push("Province");
      if (!formData.ageVerified) missingFields.push("Age Verification");
      if (!formData.agreeTerms) missingFields.push("Terms & Privacy");
      if (!formData.marketing_consent) missingFields.push("Marketing Consent");

      toast.warning(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    dispatch(clearError());

    try {
      await dispatch(register(formData)).unwrap();
      toast.success("Registered Successfully!");
      router.push("/");
    } catch (error) {
      toast.error(t("registrationFailed"));
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-6">
        {/* Home Button */}
        <div className="mb-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft />
            {t("backToHome")}
          </Link>
          <div>
            <div className="bg-linear-to-r from-[#ebf2f7] to-[#dae2e9] mb-6 p-5 rounded-xl text-center">
              <h1 className="text-3xl font-bold text-[#8cc63c]">
                {t("title")}
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error.includes("409") ? t("emailExists") : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-700 pb-2 border-b">
                {t("basicInfo")}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("fullName")} <span className="text-red-500">*</span>
                    {!formData.name.trim() && (
                      <span className="text-red-500 text-xs ml-2">
                        Required
                      </span>
                    )}
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#4a9fd8] outline-none ${
                      !formData.name.trim()
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("email")} <span className="text-red-500">*</span>
                    {!formData.email.trim() && (
                      <span className="text-red-500 text-xs ml-2">
                        Required
                      </span>
                    )}
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#4a9fd8] outline-none ${
                      !formData.email.trim()
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("password")} <span className="text-red-500">*</span>
                    {(!formData.password || formData.password.length < 6) && (
                      <span className="text-red-500 text-xs ml-2">
                        {formData.password ? "Min 6 characters" : "Required"}
                      </span>
                    )}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#4a9fd8] outline-none ${
                      !formData.password || formData.password.length < 6
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="At least 6 characters"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("province")} <span className="text-red-500">*</span>
                    {!formData.province && (
                      <span className="text-red-500 text-xs ml-2">
                        Required
                      </span>
                    )}
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-1 focus:ring-[#4a9fd8] outline-none ${
                      !formData.province ? "border-red-300" : "border-gray-300"
                    }`}
                    required
                  >
                    <option value="">Select Province</option>
                    {PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Dietary Preferences */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-700 pb-2 border-b">
                {t("dietaryPreferences")}
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("dietaryPreferences")}
                </label>
                <select
                  onChange={handleDietarySelect}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none bg-white mb-2"
                  defaultValue=""
                >
                  <option value="">{t("selectDietary")}</option>
                  {DIETARY_OPTIONS.filter(
                    (opt) => !formData.dietaryPreferences.includes(opt)
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDietary}
                    onChange={(e) => setCustomDietary(e.target.value)}
                    placeholder={t("customDietaryPlaceholder")}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCustomDietary(e)
                    }
                  />
                  <button
                    type="button"
                    onClick={handleCustomDietary}
                    className="px-4 py-2 text-sm bg-[#8cc63c] hover:bg-[#7ab32f] text-white rounded"
                  >
                    {t("add")}
                  </button>
                </div>

                {formData.dietaryPreferences.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.dietaryPreferences.map((pref, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {pref}
                        <button
                          type="button"
                          onClick={() => removeDietaryPreference(pref)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("allergies")}
                </label>
                <select
                  onChange={handleAllergySelect}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none bg-white mb-2"
                  defaultValue=""
                >
                  <option value="">{t("selectAllergy")}</option>
                  {ALLERGY_OPTIONS.filter(
                    (opt) => !formData.allergies.includes(opt)
                  ).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    placeholder={t("customAllergyPlaceholder")}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCustomAllergy(e)
                    }
                  />
                  <button
                    type="button"
                    onClick={handleCustomAllergy}
                    className="px-4 py-2 text-sm bg-[#8cc63c] hover:bg-[#7ab32f] text-white rounded"
                  >
                    {t("add")}
                  </button>
                </div>

                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => removeAllergy(allergy)}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Foods You Like
                  </label>
                  <input
                    type="text"
                    value={likesText}
                    onChange={(e) => setLikesText(e.target.value)}
                    onBlur={handleLikesBlur}
                    placeholder="chicken, quinoa, broccoli..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Separate with commas
                  </p>
                  {formData.likes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.likes.map((like, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {like}
                          <button
                            type="button"
                            onClick={() => removeLike(index)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Foods You Dislike
                  </label>
                  <input
                    type="text"
                    value={dislikesText}
                    onChange={(e) => setDislikesText(e.target.value)}
                    onBlur={handleDislikesBlur}
                    placeholder="mushrooms, olives, spicy food..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Separate with commas
                  </p>
                  {formData.dislikes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.dislikes.map((dislike, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {dislike}
                          <button
                            type="button"
                            onClick={() => removeDislike(index)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div> */}
            </div>

            {/* Section 3: Cooking Preferences */}
            {/* <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-700 pb-2 border-b">Cooking Preferences</h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Skill Level</label>
                  <select
                    name="skillLevel"
                    value={formData.skillLevel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Cooking Time</label>
                  <select
                    name="maxCookingTime"
                    value={formData.maxCookingTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none bg-white"
                  >
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                    <option value="90">90+ mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Goal</label>
                  <select
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#4a9fd8] focus:border-[#4a9fd8] outline-none bg-white"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="general_health">General Health</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Budget Level</label>
                <div className="flex gap-3">
                  {['low', 'medium', 'high'].map(level => (
                    <label key={level} className="flex-1">
                      <input
                        type="radio"
                        name="budgetLevel"
                        value={level}
                        checked={formData.budgetLevel === level}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="px-4 py-2 border border-gray-300 rounded text-center text-sm capitalize cursor-pointer peer-checked:border-[#4a9fd8] peer-checked:bg-blue-50 peer-checked:text-[#4a9fd8] hover:border-gray-400">
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div> */}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3">
                {/* 18 Age or Not */}
                <div
                  className={`flex items-start space-x-2 p-3 rounded border ${
                    !formData.ageVerified
                      ? " border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="ageVerified"
                    name="ageVerified"
                    checked={formData.ageVerified}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 text-[#4a9fd8] rounded focus:ring-[#4a9fd8]"
                    required
                  />
                  <label
                    htmlFor="ageVerified"
                    className="text-xs text-gray-700"
                  >
                    {t("ageVerification")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                {/* MANDATORY TERMS CHECKBOX  */}
                <div
                  className={`flex items-start space-x-2 p-3 rounded border ${
                    !formData.agreeTerms
                      ? " border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 text-[#4a9fd8] rounded focus:ring-[#4a9fd8]"
                    required
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-gray-700">
                    I agree to the{" "}
                    <a
                      href={`/${locale}/terms`}
                      className="text-[#4a9fd8] hover:text-[#3a8ec8] hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href={`/${locale}/privacy`}
                      className="text-[#4a9fd8] hover:text-[#3a8ec8] hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* CASL MARKETING CONSENT CHECKBOX */}
              <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded border border-gray-200 mt-3">
                <input
                  type="checkbox"
                  id="marketing_consent"
                  name="marketing_consent"
                  checked={formData.marketing_consent}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 text-[#4a9fd8] rounded focus:ring-[#4a9fd8]"
                />
                <label
                  htmlFor="marketing_consent"
                  className="text-xs text-gray-700"
                >
                  I agree to receive emails from Prepcart about meal plans,
                  feature updates, and special offers. I can unsubscribe at any
                  time.
                </label>
              </div>
            </div>
            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`w-full py-2.5 px-4 rounded text-lg font-medium transition-all ${
                  loading || !isFormValid()
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-[#8cc63c] hover:bg-[#7ab32f] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? t("creatingAccount") : t("createAccount")}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              {t("alreadyHaveAccount")}{" "}
              <Link
                href={`/${locale}/login`}
                className="text-[#8cc63c] hover:text-[#7ab32f] font-medium"
              >
                {t("loginHere")}
              </Link>
            </p>
            <p className="mt-2">{t("terms")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
