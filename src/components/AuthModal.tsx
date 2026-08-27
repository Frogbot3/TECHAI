"use client";

/**
 * AuthModal.tsx — Firebase-powered Authentication Modal
 *
 * Supports three authentication flows:
 *  1. Google Sign-In     — Firebase popup (signInWithPopup)
 *  2. Phone OTP          — Firebase signInWithPhoneNumber + reCAPTCHA + SMS OTP
 *  3. Email OTP          — Server-side secure HMAC flow via Resend email delivery
 *
 * After any Firebase client authentication, the Firebase ID token is sent to
 * /api/auth/firebase-verify for server-side verification, MongoDB user linking,
 * and secure HTTP-only session cookie creation.
 *
 * Email OTP does not go through Firebase at all — it uses a standalone secure
 * server-side flow (/api/auth/send-otp + /api/auth/verify-otp).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";
import { User as UserType } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────

type AuthMethod = "GOOGLE" | "PHONE" | "EMAIL";
type Step = "METHOD_SELECT" | "PHONE_INPUT" | "PHONE_OTP" | "EMAIL_INPUT" | "EMAIL_OTP";

const RESEND_COOLDOWN_SEC = 60;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-phone-number": "The phone number format is invalid. Please include country code (e.g., +91...).",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/quota-exceeded": "SMS quota exceeded. Please try again later.",
    "auth/invalid-verification-code": "Incorrect verification code. Please check and try again.",
    "auth/code-expired": "Verification code has expired. Please request a new one.",
    "auth/popup-closed-by-user": "Sign-in was cancelled. You can try again any time.",
    "auth/popup-blocked": "Popup was blocked by your browser. Please allow popups for this site.",
    "auth/cancelled-popup-request": "Another sign-in attempt is in progress.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/network-request-failed": "Network error. Please check your connection and try again.",
    "auth/internal-error": "An unexpected error occurred. Please try again.",
    "auth/captcha-check-failed": "reCAPTCHA verification failed. Please try again.",
    "auth/missing-phone-number": "Please enter a valid phone number.",
    "auth/invalid-app-credential": "Authentication configuration error. Please contact support.",
  };
  return map[code] || "Authentication failed. Please try again.";
}

async function exchangeFirebaseToken(idToken: string): Promise<UserType> {
  const resp = await fetch("/api/auth/firebase-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.message || "Authentication failed.");
  return data.user as UserType;
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP Input component (6 individual digit boxes)
// ─────────────────────────────────────────────────────────────────────────────

interface OtpBoxesProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function OtpBoxes({ value, onChange, disabled }: OtpBoxesProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[idx] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      inputsRef.current[5]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={value[idx] || ""}
          onChange={(e) => handleInput(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`OTP digit ${idx + 1}`}
          className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 ${
            value[idx]
              ? "border-blue-500 bg-blue-50 text-blue-900"
              : "border-slate-300 bg-white text-slate-900"
          }`}
          style={{ touchAction: "manipulation" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resend countdown button
// ─────────────────────────────────────────────────────────────────────────────

interface ResendButtonProps {
  onResend: () => void;
  disabled?: boolean;
}

function ResendButton({ onResend, disabled }: ResendButtonProps) {
  const [seconds, setSeconds] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-center mt-3">
      {seconds > 0 ? (
        <p className="text-xs text-slate-500">
          Resend code in <span className="font-bold text-slate-700">{seconds}s</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50 py-2 px-3 rounded-lg hover:bg-blue-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Resend Code
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AuthModal
// ─────────────────────────────────────────────────────────────────────────────

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>("METHOD_SELECT");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState<{ type: "error" | "info" | "success"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendKey, setResendKey] = useState(0);

  // Firebase phone auth state
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Cleanup reCAPTCHA on unmount or close
  const clearRecaptcha = useCallback(() => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch {
      // ignore
    }
    recaptchaVerifierRef.current = null;
    confirmationResultRef.current = null;
  }, []);

  const resetModal = useCallback(() => {
    setStep("METHOD_SELECT");
    setPhone("");
    setEmail("");
    setOtp("");
    setNotice(null);
    setLoading(false);
    clearRecaptcha();
  }, [clearRecaptcha]);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  if (!isOpen) return null;

  // ── Google Sign-In ──────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setNotice(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const user = await exchangeFirebaseToken(idToken);
      onLoginSuccess(user);
      handleClose();
    } catch (err: any) {
      const code = err?.code || "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setNotice({ type: "error", msg: mapFirebaseError(code) });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP: Send ─────────────────────────────────────────────────────────

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setNotice(null);

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setNotice({ type: "error", msg: "Enter a valid 10-digit mobile number." });
      return;
    }

    setLoading(true);
    clearRecaptcha();

    try {
      if (!recaptchaContainerRef.current) throw new Error("reCAPTCHA container not found.");

      // Initialize invisible reCAPTCHA (required by Firebase Phone Auth)
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setNotice({ type: "error", msg: "reCAPTCHA expired. Please try again." });
          clearRecaptcha();
        },
      });
      recaptchaVerifierRef.current = verifier;

      const fullPhone = `+91${digits}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmationResultRef.current = confirmation;

      setOtp("");
      setResendKey((k) => k + 1);
      setStep("PHONE_OTP");
      setNotice({ type: "info", msg: `OTP sent to +91 ${digits}. Check your messages.` });
    } catch (err: any) {
      clearRecaptcha();
      setNotice({ type: "error", msg: mapFirebaseError(err?.code || "") });
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP: Verify ───────────────────────────────────────────────────────

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (otp.length !== 6) {
      setNotice({ type: "error", msg: "Enter the 6-digit code sent to your phone." });
      return;
    }

    if (!confirmationResultRef.current) {
      setNotice({ type: "error", msg: "Session expired. Please request a new code." });
      setStep("PHONE_INPUT");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      const user = await exchangeFirebaseToken(idToken);
      onLoginSuccess(user);
      handleClose();
    } catch (err: any) {
      setNotice({ type: "error", msg: mapFirebaseError(err?.code || "") });
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP: Send ─────────────────────────────────────────────────────────

  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setNotice(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setNotice({ type: "error", msg: "Enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await resp.json();
      if (!data.success) {
        const retryMsg = data.retryAfter
          ? ` Please wait ${data.retryAfter}s.`
          : "";
        setNotice({ type: "error", msg: (data.message || "Could not send code.") + retryMsg });
        return;
      }
      setOtp("");
      setResendKey((k) => k + 1);
      setStep("EMAIL_OTP");
      setNotice({ type: "info", msg: data.message || "Verification code sent to your email." });
    } catch {
      setNotice({ type: "error", msg: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  // ── Email OTP: Verify ───────────────────────────────────────────────────────

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (otp.length !== 6) {
      setNotice({ type: "error", msg: "Enter the 6-digit code sent to your email." });
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await resp.json();
      if (!data.success) {
        setNotice({ type: "error", msg: data.message || "Incorrect code." });
        return;
      }
      onLoginSuccess(data.user as UserType);
      handleClose();
    } catch {
      setNotice({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const noticeEl = notice && (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        notice.type === "error"
          ? "bg-red-50 border border-red-200 text-red-800"
          : notice.type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : "bg-blue-50 border border-blue-200 text-blue-800"
      }`}
    >
      {notice.msg}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Step-specific content
  // ─────────────────────────────────────────────────────────────────────────────

  const renderMethodSelect = () => (
    <div className="space-y-3">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        id="btn-google-signin"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 min-h-[52px]"
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
        ) : (
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Phone */}
      <button
        type="button"
        onClick={() => { setNotice(null); setStep("PHONE_INPUT"); }}
        id="btn-phone-signin"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[52px]"
      >
        <Phone className="h-5 w-5 text-blue-500 flex-shrink-0" />
        <span>Continue with Phone (SMS OTP)</span>
      </button>

      {/* Email */}
      <button
        type="button"
        onClick={() => { setNotice(null); setStep("EMAIL_INPUT"); }}
        id="btn-email-signin"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400 min-h-[52px]"
      >
        <Mail className="h-5 w-5 text-violet-500 flex-shrink-0" />
        <span>Continue with Email (OTP)</span>
      </button>

      {noticeEl}
    </div>
  );

  const renderPhoneInput = () => (
    <form onSubmit={handleSendPhoneOtp} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="phone-input" className="block text-sm font-bold text-slate-700">
          Mobile Number
        </label>
        <div className="flex rounded-xl overflow-hidden border-2 border-slate-300 focus-within:border-blue-500 transition-colors">
          <span className="flex items-center bg-slate-100 px-3.5 text-sm font-bold text-slate-700 border-r border-slate-300 select-none">
            🇮🇳 +91
          </span>
          <input
            id="phone-input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit number"
            className="flex-1 px-4 py-3.5 text-sm focus:outline-none bg-white"
          />
        </div>
        <p className="text-xs text-slate-500">We will send a verification code via SMS.</p>
      </div>

      {/* reCAPTCHA invisible container */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {noticeEl}

      <button
        type="submit"
        disabled={loading || phone.replace(/\D/g, "").length !== 10}
        id="btn-send-phone-otp"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-md min-h-[52px]"
      >
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        <span>{loading ? "Sending..." : "Send OTP"}</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => { setNotice(null); setStep("METHOD_SELECT"); }}
        className="flex w-full items-center justify-center text-sm text-slate-500 hover:text-slate-800 transition py-2"
      >
        ← Back to sign-in options
      </button>
    </form>
  );

  const renderPhoneOtp = () => (
    <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-center">
        <Phone className="h-5 w-5 text-blue-500 mx-auto mb-1" />
        <p className="text-sm font-semibold text-blue-800">
          Code sent to <span className="font-black">+91 {phone}</span>
        </p>
        <p className="text-xs text-blue-600 mt-0.5">Enter the 6-digit SMS code below</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 text-center">Verification Code</label>
        <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
      </div>

      {noticeEl}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        id="btn-verify-phone-otp"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-md min-h-[52px]"
      >
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 className="h-4 w-4" />}
        <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
      </button>

      <ResendButton
        key={resendKey}
        onResend={() => { setOtp(""); handleSendPhoneOtp(); }}
        disabled={loading}
      />

      <button
        type="button"
        onClick={() => { setNotice(null); setStep("PHONE_INPUT"); clearRecaptcha(); }}
        className="flex w-full items-center justify-center text-sm text-slate-500 hover:text-slate-800 transition py-2"
      >
        ← Change number
      </button>
    </form>
  );

  const renderEmailInput = () => (
    <form onSubmit={handleSendEmailOtp} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email-input" className="block text-sm font-bold text-slate-700">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="email-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-13 w-full rounded-xl border-2 border-slate-300 pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <p className="text-xs text-slate-500">We will send a 6-digit verification code to this address.</p>
      </div>

      {noticeEl}

      <button
        type="submit"
        disabled={loading || !email.includes("@")}
        id="btn-send-email-otp"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50 shadow-md min-h-[52px]"
      >
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        <span>{loading ? "Sending..." : "Send Verification Code"}</span>
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => { setNotice(null); setStep("METHOD_SELECT"); }}
        className="flex w-full items-center justify-center text-sm text-slate-500 hover:text-slate-800 transition py-2"
      >
        ← Back to sign-in options
      </button>
    </form>
  );

  const renderEmailOtp = () => (
    <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
      <div className="rounded-2xl bg-violet-50 border border-violet-200 p-4 text-center">
        <Mail className="h-5 w-5 text-violet-500 mx-auto mb-1" />
        <p className="text-sm font-semibold text-violet-800">
          Code sent to <span className="font-black break-all">{email}</span>
        </p>
        <p className="text-xs text-violet-600 mt-0.5">Check your inbox and spam folder</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 text-center">Verification Code</label>
        <OtpBoxes value={otp} onChange={setOtp} disabled={loading} />
      </div>

      {noticeEl}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        id="btn-verify-email-otp"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-50 shadow-md min-h-[52px]"
      >
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 className="h-4 w-4" />}
        <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
      </button>

      <ResendButton
        key={resendKey}
        onResend={() => { setOtp(""); handleSendEmailOtp(); }}
        disabled={loading}
      />

      <button
        type="button"
        onClick={() => { setNotice(null); setStep("EMAIL_INPUT"); }}
        className="flex w-full items-center justify-center text-sm text-slate-500 hover:text-slate-800 transition py-2"
      >
        ← Change email
      </button>
    </form>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Header content per step
  // ─────────────────────────────────────────────────────────────────────────────

  const headerIcon = () => {
    if (step === "METHOD_SELECT") return <ShieldCheck className="h-5 w-5" />;
    if (step === "PHONE_INPUT") return <Phone className="h-5 w-5" />;
    if (step === "PHONE_OTP") return <Lock className="h-5 w-5" />;
    if (step === "EMAIL_INPUT") return <Mail className="h-5 w-5" />;
    if (step === "EMAIL_OTP") return <Lock className="h-5 w-5" />;
  };

  const headerTitle = () => {
    if (step === "METHOD_SELECT") return "Sign in to TECH AI";
    if (step === "PHONE_INPUT") return "Phone Verification";
    if (step === "PHONE_OTP") return "Enter SMS Code";
    if (step === "EMAIL_INPUT") return "Email Verification";
    if (step === "EMAIL_OTP") return "Enter Email Code";
  };

  const headerSub = () => {
    if (step === "METHOD_SELECT") return "Choose how you'd like to sign in";
    if (step === "PHONE_INPUT") return "We'll send a code to your phone";
    if (step === "PHONE_OTP") return "Firebase SMS verification";
    if (step === "EMAIL_INPUT") return "We'll send a code to your email";
    if (step === "EMAIL_OTP") return "Enter the 6-digit code from your email";
  };

  const iconBg = () => {
    if (step === "PHONE_INPUT" || step === "PHONE_OTP") return "bg-blue-600";
    if (step === "EMAIL_INPUT" || step === "EMAIL_OTP") return "bg-violet-600";
    return "bg-slate-900";
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-0 sm:p-4 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        aria-modal="true"
        role="dialog"
        aria-label="Sign in to TECH AI"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ maxHeight: "92vh", overflowY: "auto" }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close sign-in modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Handle bar for mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <div className="px-6 pt-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-colors ${iconBg()}`}>
                {headerIcon()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">{headerTitle()}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{headerSub()}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 pb-safe">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {step === "METHOD_SELECT" && renderMethodSelect()}
                {step === "PHONE_INPUT" && renderPhoneInput()}
                {step === "PHONE_OTP" && renderPhoneOtp()}
                {step === "EMAIL_INPUT" && renderEmailInput()}
                {step === "EMAIL_OTP" && renderEmailOtp()}
              </motion.div>
            </AnimatePresence>

            {/* Security badge */}
            <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Protected by Firebase Authentication &amp; encrypted sessions</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
