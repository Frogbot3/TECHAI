import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow verification builds alongside an already running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingIncludes: { "/api/orders/*": ["./public/fonts/*.ttf", "./public/brand/*.png"], "/api/orders/*/invoice": ["./public/fonts/*.ttf", "./public/brand/*.png"] },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
