"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { checkPincode } from "@/lib/storefront-config";

interface Props { isOpen: boolean; currentLocation: string; onClose: () => void; onSelectLocation: (pin: string) => void }
export default function LocationModal({ isOpen, currentLocation, onClose, onSelectLocation }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<ReturnType<typeof checkPincode> | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    setPincode(/^[1-9]\d{5}$/.test(currentLocation) ? currentLocation : "");
    setResult(null);
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [isOpen]);
  if (!isOpen) return null;
  const messages = {
    invalid: "Enter a valid 6-digit Indian pincode.",
    available: "Delivery is available to this pincode. Shipping charges are shown at checkout.",
    unavailable: "Delivery is currently unavailable to this pincode. Try another address.",
    unknown: "Pincode saved. Delivery availability is not confirmed yet; contact support before ordering.",
  };
  return <dialog ref={dialog} aria-labelledby="delivery-title" onCancel={onClose}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className="w-[calc(100%_-_2rem)] max-w-md p-0 rounded-2xl border border-slate-200 backdrop:bg-slate-950/60 shadow-2xl">
    <div className="p-5 text-slate-900">
      <div className="flex items-center justify-between gap-2 mb-4"><h2 id="delivery-title" className="font-bold flex items-center gap-2"><MapPin size={20} className="text-cyan-700" />Check delivery</h2><button onClick={onClose} aria-label="Close delivery checker" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100"><X size={20} /></button></div>
      <form onSubmit={event => {
        event.preventDefault();
        const status = checkPincode(pincode.trim());
        setResult(status);
        if (status === "available" || status === "unknown") onSelectLocation(pincode.trim());
      }}>
        <label htmlFor="delivery-pincode" className="text-sm font-semibold">Delivery pincode</label>
        <div className="flex gap-2 mt-2"><input autoFocus id="delivery-pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={pincode}
          onChange={event => { setPincode(event.target.value.replace(/\D/g, "")); setResult(null); }}
          aria-invalid={result === "invalid"} aria-describedby={result ? "delivery-result" : undefined}
          placeholder="6-digit pincode" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 h-11 text-base focus:outline-cyan-600" />
          <button className="rounded-xl bg-slate-900 text-white px-4 min-h-11 text-sm font-bold">Check</button></div>
        {result && <p id="delivery-result" role="status" className="text-sm leading-relaxed mt-4">{messages[result]}</p>}
      </form>
    </div>
  </dialog>;
}
