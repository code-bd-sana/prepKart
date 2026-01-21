"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { X } from "lucide-react";
import GenerateWeeklyPlan from "./GenerateWeeklyPlan";
import { toast } from "react-toastify";

export default function PlanModal({ isOpen, onClose, voiceText }) {
  const modalRef = useRef(null);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);
  const [showDiscardToast, setShowDiscardToast] = useState(false);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  // We'll receive updates from GenerateWeeklyPlan about whether a plan exists
  const handlePlanGenerated = useCallback((generated) => {
    setHasGeneratedPlan(generated);
  }, []);

  // Completely disable click-outside-to-close
  // We remove the handleClickOutside logic entirely — no need for it

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

  const handleClose = () => {
    if (hasGeneratedPlan) {
      // Show toast confirmation
      setShowDiscardToast(true);
      setIsConfirmingDiscard(true);

      toast(
        <div className='p-5 max-w-md'>
          <p className='font-semibold text-gray-800 text-lg mb-3'>
            Discard meal plan without saving?
          </p>
          <div className='flex gap-3 justify-end'>
            <button
              onClick={() => {
                toast.dismiss();
                setShowDiscardToast(false);
                setIsConfirmingDiscard(false);
              }}
              className='px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition'>
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                setShowDiscardToast(false);
                setIsConfirmingDiscard(false);
                onClose(); // close the modal
              }}
              className='px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition'>
              Yes, discard
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
          theme: "light",
        },
      );
    } else {
      // No unsaved plan → close immediately
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
      {/* Modal Content */}
      <div
        ref={modalRef}
        className='relative bg-white rounded-2xl w-full max-w-[1500px] max-h-[90vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className='absolute right-4 top-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
          aria-label='Close modal'>
          <X className='w-5 h-5' />
        </button>

        {/* Pass callback so child knows when a plan is generated */}
        <GenerateWeeklyPlan
          voiceText={voiceText}
          onPlanGenerated={handlePlanGenerated} // ← New prop
        />
      </div>
    </div>
  );
}
