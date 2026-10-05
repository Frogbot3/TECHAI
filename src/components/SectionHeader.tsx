import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({ title, subtitle, action, onAction, children }: {
  title: string; subtitle?: string; action?: string; onAction?: () => void; children?: ReactNode;
}) {
  return <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-4 pb-2 border-b border-slate-200">
    <div>
      <div className="flex flex-wrap items-center gap-2.5"><h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h2>{children}</div>
      {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
    </div>
    {action && onAction && <button type="button" onClick={onAction} className="min-h-11 text-xs font-bold text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1">{action}<ChevronRight className="w-3.5 h-3.5" /></button>}
  </div>;
}
