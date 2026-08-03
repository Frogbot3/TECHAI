"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User as UserType } from "@/lib/types";
import { ArrowRight, CheckCircle2, Lock, Mail, Phone, ShieldCheck, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
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

    if (phone.length !== 10) {
      setNotice("Enter a valid 10-digit phone number.");
      return;
    }
    if (!email.includes("@")) {
      setNotice("Enter an email address to receive the OTP.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, name }),
      });
      const data = await response.json();
      if (!data.success) {
        setNotice(data.message || "Unable to send OTP.");
        return;
      }
      setOtpHint(data.otpHint || null);
      setNotice(data.message || "OTP sent.");
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
      setNotice("Enter the 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, name, email }),
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        >
          <button onClick={onClose} className="absolute right-3 top-3 rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close login">
            <X className="h-5 w-5" />
          </button>

          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white">
                {step === "PHONE" ? <Phone className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">{step === "PHONE" ? "Login to continue" : "Verify OTP"}</h3>
                <p className="text-sm text-slate-500">
                  {step === "PHONE" ? "Use Google or receive OTP on email." : `Code sent to ${email}.`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {step === "PHONE" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>or email OTP</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Phone number</label>
                  <div className="flex">
                    <span className="flex h-10 items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-600">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit number"
                      className="h-10 w-full rounded-r-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email for OTP</label>
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

                {notice && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{notice}</p>}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <span>{isSendingOtp ? "Sending OTP..." : "Send OTP"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpHint && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs font-bold uppercase text-amber-800">Local testing OTP</p>
                    <p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.35em] text-amber-950">{otpHint}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">6-digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="h-12 w-full rounded-md border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {notice && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{notice}</p>}

                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep("PHONE")} className="text-sm font-semibold text-slate-600 hover:text-slate-950">
                    Change details
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-amber-500 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isVerifyingOtp ? "Verifying..." : "Verify"}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-5 flex items-center justify-center gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Login creates a secure customer session.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
