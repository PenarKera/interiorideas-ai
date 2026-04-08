"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigError } from "../../lib/supabase";

const REQUEST_TIMEOUT_MS = 15000;
const MAX_PASSWORD_LENGTH = 128;

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateOnlineState = () => setIsOnline(window.navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setError(supabaseConfigError);
      setIsReady(false);
      return undefined;
    }

    const setupSession = async () => {
      try {
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          "Password reset took too long. Please open the email link again."
        );

        if (!active) {
          return;
        }

        if (session) {
          setIsReady(true);
          return;
        }

        setError("This password reset link is expired or invalid.");
        setTimeout(() => router.push("/login"), 2500);
      } catch (requestError) {
        console.error("Password reset session setup failed:", requestError);
        if (active) {
          setError(requestError.message || "Unable to verify your reset session.");
        }
      }
    };

    setupSession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleUpdate = async () => {
    setError("");
    setSuccess("");

    if (!supabase) {
      setError(supabaseConfigError);
      return;
    }

    if (!isOnline) {
      setError("You are offline. Reconnect to update your password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      setError(`Password must stay under ${MAX_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        "Password update timed out. Please try again."
      );

      if (updateError) {
        throw updateError;
      }

      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (requestError) {
      console.error("Password update failed:", requestError);
      setError(requestError.message || "Unable to update your password right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05070A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          filter: "blur(90px)",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(8,11,20,0.94)",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.08)",
          zIndex: 1,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: 46,
              height: 46,
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              fontWeight: 800,
              fontSize: "18px",
              boxShadow: "0 8px 20px rgba(59,130,246,0.3)",
            }}
          >
            II
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "10px", letterSpacing: "-0.5px" }}>
            Secure Password Reset
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6 }}>
            Set a new password for your InteriorIdeas studio account.
          </p>
        </div>

        <div
          style={{
            marginBottom: "18px",
            padding: "12px 14px",
            borderRadius: "12px",
            border: `1px solid ${isOnline ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            background: isOnline ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
            color: isOnline ? "#86EFAC" : "#FCD34D",
            fontSize: "13px",
          }}
        >
          {isOnline ? "Connection looks good." : "You are offline. Password updates are paused."}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            maxLength={MAX_PASSWORD_LENGTH + 1}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError("");
              setSuccess("");
            }}
            style={{
              width: "100%",
              padding: "15px 18px",
              background: "#0D121F",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              color: "#fff",
              outline: "none",
              fontSize: "14px",
            }}
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            maxLength={MAX_PASSWORD_LENGTH + 1}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
              setSuccess("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                handleUpdate();
              }
            }}
            style={{
              width: "100%",
              padding: "15px 18px",
              background: "#0D121F",
              border: "1px solid #1E293B",
              borderRadius: "14px",
              color: "#fff",
              outline: "none",
              fontSize: "14px",
            }}
          />

          {error && (
            <div
              style={{
                color: "#FCA5A5",
                fontSize: "13px",
                lineHeight: 1.5,
                padding: "12px 14px",
                background: "rgba(248,113,113,0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                color: "#86EFAC",
                fontSize: "13px",
                lineHeight: 1.5,
                padding: "12px 14px",
                background: "rgba(16,185,129,0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              {success}
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={loading || !isReady || !isOnline || !supabase}
            style={{
              width: "100%",
              padding: "16px",
              background: loading
                ? "rgba(59,130,246,0.45)"
                : "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#fff",
              borderRadius: "14px",
              border: "none",
              fontWeight: 700,
              fontSize: "16px",
              cursor: loading || !isReady || !isOnline || !supabase ? "not-allowed" : "pointer",
              marginTop: "8px",
              boxShadow: loading ? "none" : "0 10px 24px rgba(59,130,246,0.2)",
              opacity: loading || !isReady || !isOnline || !supabase ? 0.7 : 1,
            }}
          >
            {loading ? "Updating password..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
