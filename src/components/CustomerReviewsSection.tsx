import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import SectionHeader from "./SectionHeader";

export default function CustomerReviewsSection({ products }: { products: Product[] }) {
  const reviews = products.flatMap(product => (product.reviews || []).filter(review => review.comment?.trim()).map(review => ({ product, review })))
    .sort((a, b) => Date.parse(b.review.date) - Date.parse(a.review.date)).slice(0, 3);
  return <section className="px-3 sm:px-6 lg:px-8 py-4">
    <SectionHeader title="Customer Reviews" subtitle="Experiences shared by our shoppers" />
    {reviews.length ? <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
      {reviews.map(({ product, review }) => <article key={`${product.id}-${review.id}`} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-1 text-sm font-bold"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{review.rating.toFixed(1)}<span className="sr-only">out of 5</span></div>
        <blockquote className="text-sm leading-relaxed text-slate-700 break-words">“{review.comment}”</blockquote>
        <p className="text-xs font-bold text-slate-900">{review.userName}{review.verifiedPurchase && <span className="block text-emerald-700 font-medium mt-1">Verified purchase</span>}</p>
        <Link prefetch={false} href={`/product/${encodeURIComponent(product.id)}`} className="block text-xs text-cyan-700 underline underline-offset-4 py-2">{product.title}</Link>
      </article>)}
    </div> : <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">No customer reviews yet. Ordered something? Share your experience from your order history.</div>}
  </section>;
}
