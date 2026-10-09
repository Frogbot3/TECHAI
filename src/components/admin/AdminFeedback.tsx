"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AdminModal } from "./AdminUI";
type Feedback = {
  notify: (message: string, tone?: "success" | "danger") => void;
  confirm: (message: string) => Promise<boolean>;
};
const Context = createContext<Feedback>({
  notify: () => {},
  confirm: async () => false,
});
export function AdminFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notice, setNotice] = useState<{
    message: string;
    tone: "success" | "danger";
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    message: string;
    resolve: (answer: boolean) => void;
  } | null>(null);
  const toast = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notice) return;
    toast.current?.showPopover?.();
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  const answer = (value: boolean) => {
    confirmation?.resolve(value);
    setConfirmation(null);
  };
  return (
    <Context.Provider
      value={{
        notify: (message, tone = "danger") => setNotice({ message, tone }),
        confirm: (message) =>
          new Promise((resolve) => setConfirmation({ message, resolve })),
      }}
    >
      {children}
      {confirmation && (
        <AdminModal label="Confirm action" onClose={() => answer(false)}>
          <div className="admin-card max-w-md">
            <h2 className="text-lg font-medium">Confirm action</h2>
            <p className="my-5 text-sm text-admin-muted">
              {confirmation.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                autoFocus
                className="admin-button"
                onClick={() => answer(false)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-primary"
                onClick={() => answer(true)}
              >
                Confirm
              </button>
            </div>
          </div>
        </AdminModal>
      )}
      {notice && (
        <div
          ref={toast}
          popover="manual"
          role={notice.tone === "danger" ? "alert" : "status"}
          className={`admin-toast ${notice.tone}`}
        >
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useAdminFeedback = () => useContext(Context);
