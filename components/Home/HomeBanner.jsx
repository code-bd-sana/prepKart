"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { FiArrowRight, FiMic } from "react-icons/fi";
import { FaCanadianMapleLeaf, FaWallet, FaCalendarTimes } from "react-icons/fa";
import PlanModal from "./PlanModal";
import useSpeechToText from "@/hooks/useSpeechToText";

export default function HomeBanner() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const recognitionRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  // speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event) => {
          const currentTranscript = event.results[0][0].transcript;
          setTranscript(currentTranscript);
          setInputText(currentTranscript);
          console.log("Voice input:", currentTranscript);
        };

        recognitionInstance.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        // Store in ref
        recognitionRef.current = recognitionInstance;
      } else {
        console.warn("Speech recognition not supported in this browser.");
      }
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceClick = () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (!isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log("Starting voice input...");
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
      }
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log("Stopping voice input...");
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // to clear the input
  const handleClearInput = () => {
    setInputText("");
    setTranscript("");
  };

  return (
    <>
      <section
        className="
      w-full 
      px-4 sm:px-10 md:px-12 lg:px-20 
      py-8 md:py-12 lg:py-16 bg-[linear-gradient(to_bottom,#8CC63C1A,#F9FAFB)]
    "
      >
        <div
          className="
        max-w-[1500px] mx-auto 
        flex flex-col lg:flex-row 
        items-center lg:items-start 
        justify-between 
        gap-10 lg:gap-0
      "
        >
          {/* LEFT SIDE */}
          <div className="w-full lg:w-[45%]">
            {/* Heading */}
            <h1
              className="
            text-[32px] sm:text-[38px] md:text-[50px] lg:text-[65px]
            
            leading-10 sm:leading-12 md:leading-[55px] lg:leading-[62px]
            tracking-[-0.5px]
            text-[#1E1E1E]
            mb-5
          "
            >
              From Kitchen Stress to <br className="hidden lg:block" />
              Grocery Success
            </h1>

            {/* Subtext */}
            <p
              className="
            text-[15px] md:text-[16px]
            leading-6 md:leading-[26px]
            text-[#666666]
            w-full md:w-[680px]
            mb-10
          "
            >
              Prepcart creates custom weekly meal plans, easy grocery lists, and
              budget-friendly recipe suggestions tailored to your taste, diet,
              and lifestyle — so you save time, money, and mental energy.
            </p>

            {/* Voice/Text Input Section */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your preferences"
                  value={inputText}
                  onChange={handleInputChange}
                  className="
                  w-full p-4 pl-4 pr-32 
                  border border-gray-300 
                  rounded-xl 
                  focus:border-[#4a9fd8] 
                  focus:ring-2 focus:ring-[#4a9fd8]/20 
                  focus:outline-none 
                  text-gray-700 bg-white 
                  shadow-sm
                  text-[15px]
                "
                />

                {/* Voice Button */}
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  className={`
                  absolute right-3 top-1/2 
                  transform -translate-y-1/2 
                  px-3 py-2 rounded-lg 
                  flex items-center gap-2
                  ${
                    isListening
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-[#4a9fd8]/10 text-gray-600 hover:bg-[#4a9fd8]/20"
                  } 
                  transition-colors
                  text-sm font-medium
                `}
                >
                  {isListening ? (
                    <>
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Listening...</span>
                    </>
                  ) : (
                    <>
                      <FiMic className="text-base" />
                    </>
                  )}
                </button>

                {/* Clear button when there's text */}
                {inputText && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="
                    absolute right-28 top-1/2 
                    transform -translate-y-1/2 
                    text-gray-400 hover:text-gray-600
                    text-sm
                  "
                    title="Clear input"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Voice input tips */}
              {transcript && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Voice input:</span>{" "}
                    {transcript}
                  </p>
                </div>
              )}
            </div>

            <div>
              {/* Buttons */}
              <div
                className="
            flex flex-col sm:flex-row 
            items-start sm:items-center 
            gap-3 
            mt-6
          "
              >
                <button
                  onClick={() => setShowModal(true)}
                  className="
              p-3 text-[14px] font-medium 
              text-white 
              rounded-[10px] 
              bg-[#8cc63c]
              hover:bg-[#5a9e3a]
              transition-colors
              shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
              w-full sm:w-auto
              flex items-center justify-center gap-2
            "
                >
                  Generate My Weekly Plan <FiArrowRight />
                </button>

                <Link href="/services">
                  <button
                    className="
              p-3 text-[14px] font-medium 
              text-[#4a9fd8] hover:text-white
              rounded-[10px] border-2 border-[#E5E5E5]
              bg-white hover:bg-[#4a9fd8]
              transition-colors
              shadow-[0px_3px_10px_rgba(0,0,0,0.08)]
              w-full sm:w-auto
              flex items-center justify-center gap-2
            "
                  >
                    Start With a Quick-Start Plan <FiArrowRight />
                  </button>
                </Link>
              </div>
              {/* Badges */}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#4a9fd8] rounded-full border border-blue-100">
                  <FaCanadianMapleLeaf className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    Trusted by Canadians
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#4a9fd8] rounded-full border border-green-100">
                  <FaWallet className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    Budget-friendly options
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#4a9fd8] rounded-full border border-purple-100">
                  <FaCalendarTimes className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">No commitment</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE IMAGE */}
          <div className="w-full lg:w-[55%] flex justify-end">
            <Image
              src="/HeroImage2.png"
              width={749}
              height={549}
              alt="Marketplace"
              className="
      rounded-[22px] 
      w-full 
      max-w-[500px] sm:max-w-[600px] lg:max-w-[600px]
      object-contain
      max-h-[400px] sm:max-h-[450px] lg:max-h-[600px]
    "
            />
          </div>
        </div>
      </section>
      {/* Add Modal */}
      <PlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        voiceText={inputText}
      />
    </>
  );
}
