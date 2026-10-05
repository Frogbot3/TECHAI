import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Quote, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";
import SectionHeader from "./SectionHeader";

// Older reviews store selected highlights at the end of the comment.
// Present those as separate chips without changing the saved review.
function reviewContent(comment: string) {
  const match = comment.match(/(?:\s|\\n)*\[Highlights:\s*([\s\S]*?)\]\s*$/);
  return {
    text: match ? comment.slice(0, match.index).trim() : comment.trim(),
    highlights: match ? match[1].split(",").map(tag => tag.trim()).filter(Boolean) : [],
  };
}

export default function CustomerReviewsSection({ products }: { products: Product[] }) {
  const reviews = products
    .flatMap(product => (product.reviews || [])
      .filter(review => review.comment?.trim())
      .map(review => ({ product, review })))
    .sort((a, b) => Date.parse(b.review.date) - Date.parse(a.review.date))
    .slice(0, 3);

  return (
    <section className="px-3 sm:px-6 lg:px-8 py-4">
      <SectionHeader title="Customer Reviews" subtitle="Experiences shared by our shoppers" />
      {reviews.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {reviews.map(({ product, review }) => {
            const { text, highlights } = reviewContent(review.comment);
            const initials = review.userName.trim().split(/\s+/)
              .filter(Boolean).slice(0, 2).map(name => name[0]).join("").toUpperCase() || "C";

            return (
              <article key={product.id + "-" + review.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-inset ring-cyan-100">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-bold leading-snug text-slate-900 break-words">{review.userName}</p>
                    {review.verifiedPurchase && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />Verified purchase
                      </span>
                    )}
                  </div>
                  <Quote aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-slate-200" />
                </div>

                <div className="mt-5 flex items-center gap-2" aria-label={review.rating.toFixed(1) + " out of 5 stars"}>
                  <div className="flex gap-0.5" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className={"h-3.5 w-3.5 " + (index < Math.round(review.rating)
                        ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200")} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700" aria-hidden="true">{review.rating.toFixed(1)}</span>
                </div>
                {text && <blockquote className="mt-3 text-sm leading-relaxed text-slate-700 break-words">“{text}”</blockquote>}
                {highlights.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {highlights.map((highlight, index) => (
                      <span key={index} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-100">{highlight}</span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <Link prefetch={false} href={"/product/" + encodeURIComponent(product.id)}
                    aria-label={"View " + product.title}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5 transition-colors hover:border-cyan-200 hover:bg-cyan-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1.5">
                      <ProductImage src={product.normalizedImage || product.image}
                        fallbacks={[product.originalImage || "", product.image, ...(product.images || [])]}
                        alt={product.title} width={64} height={64} sizes="64px"
                        className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-relaxed text-slate-800 group-hover:text-cyan-800">{product.title}</p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-sm font-extrabold text-slate-900">₹{product.price.toLocaleString("en-IN")}</span>
                        {product.originalPrice > product.price && <del className="text-[10px] text-slate-500">₹{product.originalPrice.toLocaleString("en-IN")}</del>}
                      </div>
                    </div>
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-cyan-700" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No customer reviews yet. Ordered something? Share your experience from your order history.
        </div>
      )}
    </section>
  );
}
