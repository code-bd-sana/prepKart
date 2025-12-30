"use client";
import { useState } from "react";

export default function CookieConsent() {
  const [open, setOpen] = useState(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cookie-consent")
        : null;
    return !stored;
  });

  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false); // default OFF

  const acceptAll = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ essential: true, analytics: true })
    );
    setOpen(false);
  };

  const savePreferences = () => {
    localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ essential: true, analytics })
    );
    setShowPrefs(false);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Banner */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background:
            "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
          color: "#ffffff",
          padding: "16px",
          zIndex: 9999,
          boxShadow: "0 -5px 18px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, flex: 1 }}>
            We use cookies to operate our website, analyze usage, and improve
            your experience. You can accept or manage your preferences at any
            time.
          </p>

          <button
            onClick={acceptAll}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              background: "white",
              color: "#047857",
              fontWeight: 600,
            }}
          >
            Accept all
          </button>

          <button
            onClick={() => setShowPrefs(true)}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              border: "2px solid white",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Manage preferences
          </button>
        </div>
      </div>

      {/* Modal */}
      {showPrefs && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <h3>Cookie Preferences</h3>

            <p>
              <strong>Essential cookies</strong> are required for the website to
              function and cannot be disabled.
            </p>

            <label style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Analytics cookies help us understand how users interact with
              Prepcart.
            </label>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowPrefs(false)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  background: "white",
                }}
              >
                Cancel
              </button>

              <button
                onClick={savePreferences}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
