"use client";
import React, { useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { fallbacks?: string[] };
export default function ProductImage({ src, fallbacks = [], ...props }: Props) {
  const sources = [...new Set([typeof src === "string" ? src : "", ...fallbacks, "/product-placeholder.svg"].filter(Boolean))];
  return <ImageAttempt key={sources.join("|")} sources={sources} {...props} />;
}
function ImageAttempt({ sources, className = "", ...props }: Omit<Props, "src"> & { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return <img {...props} src={sources[index]} aria-busy={!loaded} className={`${className} ${loaded ? "" : "animate-pulse bg-slate-200/30"}`}
    onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setIndex(i => Math.min(i + 1, sources.length - 1)); }} />;
}
