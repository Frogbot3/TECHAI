export function isProductImageSource(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  if (/^\/(?!\/)[^\\]*$/.test(value)) return true;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

export function validateProductImages(body: Record<string, unknown>, required = false): string | null {
  if (body.images !== undefined && (!Array.isArray(body.images) || body.images.length > 7)) return "Supply up to seven product images.";
  const sources = [body.image, body.originalImage, body.normalizedImage, ...(Array.isArray(body.images) ? body.images : [])].filter(v => v !== undefined && v !== "");
  if (required && !sources.length) return "Add a product image and check that it shows the correct model.";
  return sources.every(isProductImageSource) ? null : "Use an HTTPS image URL, local image path, or uploaded PNG/JPEG/WebP/GIF.";
}

// Browser-side loading avoids an arbitrary server-side URL fetch (SSRF).
export async function checkProductImages(sources: string[]) {
  await Promise.all([...new Set(sources.filter(Boolean))].map(source => new Promise<void>((resolve, reject) => {
    if (!isProductImageSource(source)) { reject(new Error("Use a valid HTTPS image URL or uploaded image.")); return; }
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("An image timed out. Check all image URLs before saving.")), 10000);
    image.onload = () => { clearTimeout(timer); resolve(); };
    image.onerror = () => { clearTimeout(timer); reject(new Error("An image could not be loaded. Replace the broken URL before saving.")); };
    image.src = source;
  })));
}
