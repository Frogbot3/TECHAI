import { ProductCardSkeleton } from "@/components/ProductCard";

export default function Loading() {
  return <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4" aria-busy="true">
    <p role="status" className="sr-only">Loading the store</p>
    <div className="h-32 bg-slate-200 rounded-xl motion-safe:animate-pulse" />
    <div className="h-[284px] sm:h-[360px] bg-slate-200 rounded-2xl motion-safe:animate-pulse" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
      {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  </main>;
}
