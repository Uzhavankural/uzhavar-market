"use client";

import { useState, useEffect } from "react";

/**
 * Global function to trigger a pop-up toast notification from anywhere in the application.
 * @param {string} message - Message to display
 * @param {'success' | 'warning' | 'error' | 'info'} type - Type of notification
 * @param {number} duration - Duration in milliseconds (default 4000ms = 4 seconds)
 */
export function showToast(message, type = "success", duration = 4000) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("app-toast", {
        detail: {
          id: Date.now() + Math.random(),
          message,
          type,
          duration,
        },
      })
    );
  }
}

/**
 * Store a flash toast that will display on the next page after router.push() navigation.
 */
export function setFlashToast(message, type = "success", duration = 4000) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        "uzhavar_flash_toast",
        JSON.stringify({ message, type, duration })
      );
    } catch (e) {}
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // 1. Intercept standard window.alert to automatically convert all legacy alerts to 4s popups
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showToast(String(msg), "info", 4000);
    };

    // 2. Check for any flash toast queued before page redirection
    try {
      const flash = sessionStorage.getItem("uzhavar_flash_toast");
      if (flash) {
        sessionStorage.removeItem("uzhavar_flash_toast");
        const parsed = JSON.parse(flash);
        if (parsed?.message) {
          setTimeout(() => {
            showToast(parsed.message, parsed.type || "success", parsed.duration || 4000);
          }, 150);
        }
      }
    } catch (e) {}

    // 3. Listen for toast events
    function handleToast(e) {
      const { id, message, type = "success", duration = 4000 } = e.detail || {};
      if (!message) return;

      // Smart classification if generic type passed
      let resolvedType = type;
      const lower = String(message).toLowerCase();
      if (
        lower.includes("waiting") ||
        lower.includes("approval") ||
        lower.includes("pending") ||
        lower.includes("review")
      ) {
        resolvedType = "warning";
      } else if (
        lower.includes("error") ||
        lower.includes("failed") ||
        lower.includes("banned") ||
        lower.includes("denied") ||
        lower.includes("rejected")
      ) {
        resolvedType = "error";
      } else if (
        lower.includes("saved") ||
        lower.includes("success") ||
        lower.includes("approved") ||
        lower.includes("updated") ||
        lower.includes("added") ||
        lower.includes("accepted") ||
        lower.includes("unbanned")
      ) {
        resolvedType = "success";
      }

      const newToast = {
        id: id || Date.now() + Math.random(),
        message,
        type: resolvedType,
        duration: duration || 4000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Exactly 4 seconds auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration);
    }

    window.addEventListener("app-toast", handleToast);

    return () => {
      window.removeEventListener("app-toast", handleToast);
      window.alert = originalAlert;
    };
  }, []);

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-3 pointer-events-none w-[94vw] sm:w-[440px] max-w-full"
    >
      {toasts.map((toast) => {
        let borderColor = "border-green-200";
        let iconBg = "bg-green-100 text-green-800";
        let icon = "✓";
        let title = "Changes Saved";
        let progressBg = "bg-green-600";

        if (toast.type === "warning") {
          borderColor = "border-amber-300";
          iconBg = "bg-amber-100 text-amber-800";
          icon = "⏳";
          title = "Waiting for Admin Approval";
          progressBg = "bg-amber-500";
        } else if (toast.type === "error") {
          borderColor = "border-red-200";
          iconBg = "bg-red-100 text-red-700";
          icon = "✕";
          title = "Attention";
          progressBg = "bg-red-500";
        } else if (toast.type === "info") {
          borderColor = "border-blue-200";
          iconBg = "bg-blue-100 text-blue-800";
          icon = "ℹ️";
          title = "Notification";
          progressBg = "bg-blue-600";
        }

        // Custom titles based on message content
        const lowerMsg = String(toast.message).toLowerCase();
        if (lowerMsg.includes("waiting for admin approval") || lowerMsg.includes("approval")) {
          title = "Waiting for Admin Approval";
        } else if (lowerMsg.includes("saved") || lowerMsg.includes("updated")) {
          title = "Changes Saved";
        } else if (lowerMsg.includes("approved")) {
          title = "Approved";
        }

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden w-full bg-white/95 backdrop-blur-md border ${borderColor} rounded-2xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.08)] p-3.5 sm:p-4 toast-slide-in`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-xs`}
              >
                {icon}
              </div>

              <div className="flex-1 pt-0.5 min-w-0 pr-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                  {title}
                </p>
                <p className="text-xs sm:text-[14px] font-semibold text-gray-900 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 text-lg p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>

            {/* Exactly 4 seconds animated countdown progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/80 overflow-hidden">
              <div
                className={`h-full ${progressBg}`}
                style={{
                  animation: `shrinkWidth ${toast.duration || 4000}ms linear forwards`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
