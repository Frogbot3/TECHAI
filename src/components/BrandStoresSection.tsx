import type { Product } from "@/lib/types";
import SectionHeader from "./SectionHeader";
import { ArrowUpRight } from "lucide-react";

export default function BrandStoresSection({ products, onSelectBrand }: { products: Product[]; onSelectBrand: (brand: string) => void }) {
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].slice(0, 8);
  if (!brands.length) return null;
  return <section className="px-3 sm:px-6 lg:px-8 py-4">
    <SectionHeader title="Shop by Brand" subtitle="Find favourites from our current catalogue" />
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {brands.map(brand => <button key={brand} onClick={() => onSelectBrand(brand)} className="min-h-20 flex items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 hover:border-cyan-500 text-left text-sm font-bold text-slate-900">
        <span className="break-words min-w-0">{brand}</span><ArrowUpRight className="w-4 h-4 shrink-0 text-cyan-700" />
      </button>)}
    </div>
  </section>;
}
