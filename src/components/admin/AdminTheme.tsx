"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { AdminFeedbackProvider } from "./AdminFeedback";
type Preference = "light" | "dark" | "system";
const ThemeContext = createContext<{
  preference: Preference;
  change: (value: Preference) => void;
}>({ preference: "light", change: () => {} });
export function AdminThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preference, setPreference] = useState<Preference | null>(null);
  useEffect(() => {
    setPreference(
      (document.getElementById("admin-root")?.dataset.preference ||
        "light") as Preference,
    );
  }, []);
  const change = (value: Preference) => {
    setPreference(value);
    try {
      localStorage.setItem("techai-admin-theme-v1", value);
    } catch {}
  };
  useEffect(() => {
    if (!preference) return;
    const root = document.getElementById("admin-root");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (root) {
        root.dataset.preference = preference;
        root.dataset.theme =
          preference === "system"
            ? media.matches
              ? "dark"
              : "light"
            : preference;
      }
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);
  return (
    <ThemeContext.Provider
      value={{ preference: preference || "light", change }}
    >
      <MotionConfig reducedMotion="user">
        <AdminFeedbackProvider>{children}</AdminFeedbackProvider>
      </MotionConfig>
    </ThemeContext.Provider>
  );
}
export function ThemeSelector() {
  const { preference, change } = useContext(ThemeContext);
  return (
    <select
      aria-label="Admin theme"
      className="admin-theme-select"
      value={preference}
      onChange={(event) => change(event.target.value as Preference)}
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
