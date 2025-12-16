"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import GenerateWeeklyPlan from "./GenerateWeeklyPlan";

export default function PlanModal({ isOpen, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl w-full max-w-[1500px] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GenerateWeeklyPlan Component */}
        <GenerateWeeklyPlan />
      </div>
    </div>
  );
}