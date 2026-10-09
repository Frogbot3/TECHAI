"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeSelector } from "@/components/admin/AdminTheme";
import TechAiLogo from "@/components/TechAiLogo";
import { ArrowRight } from "lucide-react";

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
        setError(
          data.message || "Invalid email or password. Please try again.",
        );
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
    <div className="admin-login">
      <div className="admin-login-toolbar">
        <ThemeSelector />
      </div>
      <section className="admin-card admin-login-card">
        <TechAiLogo size="lg" />
        <h1>Welcome back</h1>
        <p>Sign in to manage your TECH AI store.</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="admin-email">Administrator email</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg p-3 text-sm bg-admin-danger-bg text-admin-danger"
            >
              {error}
            </p>
          )}
          <button
            className="admin-button admin-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in to your workspace"}
            <ArrowRight size={16} />
          </button>
        </form>
        <a href="/">Return to the storefront</a>
      </section>
    </div>
  );
}
