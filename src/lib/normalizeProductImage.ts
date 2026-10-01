export type ProductImageFit = "auto" | "standard" | "full-product";
export type ProductImageScale = "small" | "medium" | "large";
export type ProductImagePosition = "center" | "top" | "bottom";

export interface ProductImageNormalizationOptions {
  fit?: ProductImageFit;
  scale?: ProductImageScale;
  position?: ProductImagePosition;
  size?: number;
}

const DEFAULT_SIZE = 1000;

const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  if (!source.startsWith("data:") && !source.startsWith("blob:")) image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("The image could not be loaded for normalization."));
  image.src = source;
});

/**
 * Creates a lightweight, loss-tolerant square catalog asset in the browser.
 * The original URL/data URL is never modified. If an external image blocks
 * canvas access, callers can keep using the original image as a safe fallback.
 */
export async function normalizeProductImage(
  source: string,
  options: ProductImageNormalizationOptions = {}
): Promise<string> {
  if (!source) throw new Error("An image is required for normalization.");

  const image = await loadImage(source);
  const size = options.size || DEFAULT_SIZE;
  const fit = options.fit || "auto";
  const scale = options.scale || "medium";
  const position = options.position || "center";
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  context.fillStyle = "#f8fafc";
  context.fillRect(0, 0, size, size);

  const scaleMultiplier = { small: 0.82, medium: 0.94, large: 1.04 }[scale];
  const fitMultiplier = fit === "full-product" ? 1.08 : fit === "standard" ? 0.98 : 1;
  const edgePadding = 0.09;
  const maxContentSize = size * (1 - edgePadding * 2) * scaleMultiplier * fitMultiplier;
  const sourceRatio = image.naturalWidth / image.naturalHeight || 1;
  let width = maxContentSize;
  let height = maxContentSize;

  if (sourceRatio >= 1) height = width / sourceRatio;
  else width = height * sourceRatio;

  const x = (size - width) / 2;
  const y = position === "top"
    ? size * edgePadding
    : position === "bottom"
      ? size - size * edgePadding - height
      : (size - height) / 2;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, width, height);

  return canvas.toDataURL("image/webp", 0.86);
}
