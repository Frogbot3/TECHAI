"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, ChevronDown, Mail } from "lucide-react";
import { storefrontConfig } from "@/lib/storefront-config";
import TechAiLogo from "./TechAiLogo";
interface FooterProps {
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
  onSelectCategory?: (category: string) => void;
}
const categories = [
  "Electronics",
  "Mobiles & Wearables",
  "Computers & Gaming",
  "Home Appliances",
  "Fashion",
  "Grocery & Essentials",
  "Toys & Stress Relief",
  "Beauty & Personal Care",
  "AI Electronics",
];
const supportEmail = storefrontConfig.email;

export default function Footer({ onOpenTracking, onOpenAuth }: FooterProps) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () =>
      root.current
        ?.querySelectorAll("details")
        .forEach((el) => (el.open = media.matches));
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <footer ref={root} className="retail-footer">
      <div className="retail-footer-inner">
        <div className="retail-footer-brand">
          <Link prefetch={false} href="/" aria-label="TECH AI home">
            <TechAiLogo
              size="md"
              className="text-white [&_span]:!text-inherit"
            />
          </Link>
          <p>
            Electronics, style and everyday essentials.
            <br />
            Discover your next favourite at {storefrontConfig.companyName}.
          </p>
          {storefrontConfig.helpline && <a href={`tel:${storefrontConfig.helpline.replace(/[^+\d]/g, "")}`}>{storefrontConfig.helpline}</a>}
          {supportEmail && (
            <a href={`mailto:${supportEmail}`}>
              <Mail size={17} />
              {supportEmail}
            </a>
          )}
        </div>
        <details open>
          <summary>
            Shop
            <ChevronDown size={16} />
          </summary>
          <nav aria-label="Footer categories">
            {categories.map((category) => (
              <Link prefetch={false}
                key={category}
                href={`/search?q=${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            ))}
          </nav>
        </details>
        <details open>
          <summary>
            Help & orders
            <ChevronDown size={16} />
          </summary>
          <nav aria-label="Customer help">
            <Link prefetch={false} href="/orders">Orders & invoices</Link>
            {onOpenTracking ? (
              <button onClick={onOpenTracking}>Track your order</button>
            ) : (
              <Link prefetch={false} href="/orders">Track your order</Link>
            )}
            <Link prefetch={false} href="/orders">Return / refund requests</Link>
            {onOpenAuth && <button onClick={onOpenAuth}>Account help</button>}
          </nav>
        </details>
        <details open>
          <summary>
            Connect
            <ChevronDown size={16} />
          </summary>
          <nav aria-label="Connect with TECH AI">
            {supportEmail && (
              <a href={`mailto:${supportEmail}`}>Email support</a>
            )}
            <Link prefetch={false} href="/wishlist">Your wishlist</Link>
            {onOpenAuth ? (
              <button onClick={onOpenAuth}>Sign in to your account</button>
            ) : (
              <Link prefetch={false} href="/orders">Your account</Link>
            )}
            <Link prefetch={false} href="/search">Explore the store</Link>
          </nav>
          <div className="retail-footer-payments">
            <p>Payment options</p>
            <div>
              <span>UPI</span>
              <span>Cards</span>
              <span>NetBanking</span>
              <span>COD</span>
            </div>
          </div>
        </details>
        <div className="retail-footer-bottom">
          <p>© {new Date().getFullYear()} TECH AI</p>
          <button
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            Back to top
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
