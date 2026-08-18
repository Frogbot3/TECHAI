"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import TechAiLogo from "@/components/TechAiLogo";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid email or password. Please try again.");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-purple-500/20 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 space-y-6 relative z-10"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block p-4 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl border border-cyan-500/30 mb-1"
          >
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
          </motion.div>
          <TechAiLogo size="lg" className="justify-center" />
          <h2 className="text-xl font-black bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
            Admin Control Portal
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter your authorized administrator credentials to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Email</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@techai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 font-medium transition-all"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300 font-semibold"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full"
                />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Access Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="text-center pt-2">
          <a href="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
            ← Return to TECH AI Storefront
          </a>
        </div>
      </motion.div>
    </div>
  );
}
