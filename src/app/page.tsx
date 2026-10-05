import HomePage from "@/components/HomePage";
import { getStorefrontSnapshot } from "@/lib/storefront-catalog";

export const revalidate = 60;

export default async function Page() {
  const { products, campaigns, isFallback } = await getStorefrontSnapshot();
  return <HomePage initialProducts={products} initialCampaigns={campaigns} refreshOnMount={isFallback} />;
}
