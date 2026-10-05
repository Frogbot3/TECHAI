"use client";
import { useState } from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "alt"> & { src?: string; alt: string; fallbacks?: string[] };
const optimizedHosts = new Set(["images.unsplash.com", "api.dicebear.com"]);

export default function ProductImage({ src, fallbacks = [], ...props }: Props) {
  const sources = [...new Set([src, ...fallbacks, "/product-placeholder.svg"].filter((s): s is string => !!s))];
  return <ImageAttempt key={sources.join("|")} sources={sources} {...props} />;
}
function ImageAttempt({ sources, className = "", onLoad, onError, ...props }: Omit<Props, "src"> & { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[index];
  // Admin uploads on other hosts remain usable without opening the optimizer to arbitrary URLs.
  let unoptimized = src.startsWith("data:") || src.endsWith(".svg");
  if (/^https?:/.test(src)) {
    try { const url = new URL(src); unoptimized = unoptimized || !optimizedHosts.has(url.hostname) || /(?:\.svg|\/svg)$/.test(url.pathname); } catch { unoptimized = true; }
  }
  return <Image {...(props.fill ? {} : { width: 400, height: 400 })} sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 200px"
    {...props} src={src} unoptimized={unoptimized} aria-busy={!loaded}
    className={className + (loaded ? "" : " motion-safe:animate-pulse bg-slate-200/40")}
    onLoad={event => { setLoaded(true); onLoad?.(event); }}
    onError={event => {
      if (index < sources.length - 1) { setLoaded(false); setIndex(index + 1); }
      else setLoaded(true);
      onError?.(event);
    }} />;
}
