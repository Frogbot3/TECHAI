"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User as UserType } from "@/lib/types";
import { ArrowRight, CheckCircle2, Lock, Mail, Phone, ShieldCheck, X, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

type AuthMethod = "PHONE" | "EMAIL";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [method, setMethod] = useState<AuthMethod>("PHONE");
  const [step, setStep] = useState<"INPUT" | "OTP">("INPUT");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    setOtpHint(null);

    if (method === "PHONE") {
      if (phone.replace(/\D/g, "").length !== 10) {
        setNotice("Enter a valid 10-digit phone number.");
        return;
      }
    } else {
      if (!email || !email.includes("@")) {
        setNotice("Enter a valid email address.");
        return;
      }
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: method === "PHONE" ? phone : "",
          email: method === "EMAIL" ? email : "",
          name,
          method: method.toLowerCase(),
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setNotice(data.message || "Unable to send OTP.");
        return;
      }
      setOtpHint(data.otpHint || null);
      setNotice(data.message || "OTP sent successfully.");
      setStep("OTP");
    } catch {
      setNotice("Unable to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");

    if (otp.trim().length !== 6) {
      setNotice("Enter the 6-digit OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: method === "PHONE" ? phone : "",
          email: method === "EMAIL" ? email : "",
          otp,
          name,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setNotice(data.message || "OTP verification failed.");
        return;
      }
      onLoginSuccess(data.user);
      onClose();
    } catch {
      setNotice("Unable to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google/start";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3.5 top-3.5 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close login modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-amber-400 shadow-md">
                {step === "OTP" ? <Lock className="h-5 w-5" /> : method === "PHONE" ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  {step === "OTP" ? "Verify Code" : "Welcome to TECH AI"}
                </h3>
                <p className="text-sm text-slate-500">
                  {step === "OTP"
                    ? `OTP sent to ${method === "PHONE" ? `+91 ${phone}` : email}`
                    : "Sign in using Google, Phone, or Email"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {step === "INPUT" ? (
              <div className="space-y-5">
                {/* Google Quick Login */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>or continue with OTP</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Method selector tabs */}
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setMethod("PHONE")}
                    className={`flex items-center justify-center gap-2 rounded-md py-2 transition ${
                      method === "PHONE"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    <span>Phone OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("EMAIL")}
                    className={`flex items-center justify-center gap-2 rounded-md py-2 transition ${
                      method === "EMAIL"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email OTP</span>
                  </button>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Name field (optional/helpful) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Smith"
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {method === "PHONE" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Mobile Phone Number</label>
                      <div className="flex">
                        <span className="flex h-10 items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-600">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="10-digit mobile number"
                          className="h-10 w-full rounded-r-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {notice && <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-900">{notice}</p>}

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-md"
                  >
                    <span>{isSendingOtp ? "Sending OTP..." : "Get Verification Code"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpHint && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-center shadow-inner">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Local Test Code
                    </p>
                    <p className="mt-1 font-mono text-2xl font-black tracking-[0.35em] text-amber-950">{otpHint}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="h-12 w-full rounded-lg border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {notice && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{notice}</p>}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("INPUT")}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-950 transition"
                  >
                    ← Back / Change
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-500 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isVerifyingOtp ? "Verifying..." : "Verify & Sign In"}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Encrypted & secure customer authentication.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
