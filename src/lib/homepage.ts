import type { Product, HeroCampaign } from "./types";

/** Allocate each product once, retaining the catalogue's merchandising order. */
export function homepageCollections(products: Product[], campaigns: HeroCampaign[] = []) {
  const unique = [...new Map(products.map(product => [product.id, product])).values()];
  const campaignIds = new Set(campaigns.map(c => c.productId));
  const flashDeals = unique.filter(p => p.discountPercent >= 20 && p.stock > 0)
    .sort((a, b) => Number(campaignIds.has(b.id)) - Number(campaignIds.has(a.id)) || Number(b.discountPercent >= 40) - Number(a.discountPercent >= 40)).slice(0, 6);
  const used = new Set(flashDeals.map(p => p.id));
  const bestSellers = unique.filter(p => !used.has(p.id) && (p.isBestSeller || p.rating >= 4.4)).slice(0, 6);
  bestSellers.forEach(p => used.add(p.id));
  const recommendedProducts = unique.filter(p => !used.has(p.id)).sort((a, b) => Number(!!b.isTrending) - Number(!!a.isTrending)).slice(0, 6);
  return { flashDeals, bestSellers, recommendedProducts };
}

export function countdown(endAt: string, now: number) {
  const end = Date.parse(endAt);
  if (!Number.isFinite(end)) return null;
  const seconds = Math.max(0, Math.ceil((end - now) / 1000));
  return { expired: seconds === 0, label: [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(part => String(part).padStart(2, "0")).join(":") };
}

/** Prefer a complete short headline to a clipped catalogue title. */
export function heroHeadline(title: string, brand: string, category: string) {
  const clean = title.replace(/\.{3}|…/g, "").trim();
  if (clean && clean.split(/\s+/).length <= 6) return clean;
  const subject = category.includes("Gaming") ? "Your next setup starts here"
    : category.includes("Wearables") ? "Stay connected, every day"
    : category.includes("Appliances") ? "Everyday living, made easier"
    : "Discover your next favourite";
  return brand && brand.split(/\s+/).length === 1 ? `${brand}: ${subject}` : subject;
}

export function heroSupport(text: string, discount: number) {
  const clean = text.replace(/\.{3}|…/g, "").trim();
  return clean && clean.length <= 30 && !/genuine|official.*warranty/i.test(clean)
    ? clean : discount > 0 ? `Save ${discount}% today.` : "Made for your everyday.";
}
