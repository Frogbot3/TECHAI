import { toClientProduct } from "./serializers";

const REFERENCE_PREFIX = "__techai_image_reference__:";

// Replace inline image bytes inside MongoDB, before they cross the network.
// Keep every editable product field, including gallery order and image settings.
const compactImage = (value: string, field: unknown) => ({
  $cond: [
    { $regexMatch: { input: { $ifNull: [value, ""] }, regex: "^data:image/" } },
    { $concat: [REFERENCE_PREFIX, field] },
    value,
  ],
});

export const adminProductImageProjection = {
  image: compactImage("$image", "image"),
  originalImage: compactImage("$originalImage", "originalImage"),
  normalizedImage: compactImage("$normalizedImage", "normalizedImage"),
  images: {
    $map: {
      input: { $range: [0, { $size: { $ifNull: ["$images", []] } }] },
      as: "index",
      in: {
        $let: {
          vars: { image: { $arrayElemAt: ["$images", "$$index"] } },
          in: compactImage("$$image", { $toString: "$$index" }),
        },
      },
    },
  },
};

export function toAdminProduct(record: any) {
  const product = toClientProduct(record);
  const version = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
  const imageUrl = (value: string) =>
    value.startsWith(REFERENCE_PREFIX)
      ? `/api/products/${encodeURIComponent(product.id)}/image?field=${value.slice(REFERENCE_PREFIX.length)}&v=${version}`
      : value;
  return {
    ...product,
    image: imageUrl(product.image),
    originalImage: imageUrl(product.originalImage || ""),
    normalizedImage: imageUrl(product.normalizedImage || ""),
    images: product.images?.map(imageUrl),
  };
}

const imageValues = (body: Record<string, unknown>) => [
  body.image,
  body.originalImage,
  body.normalizedImage,
  ...(Array.isArray(body.images) ? body.images : []),
];
const isImageReference = (value: unknown): value is string =>
  typeof value === "string" &&
  value.startsWith("/api/products/") &&
  value.includes("/image?");
export const hasProductImageReferences = (body: Record<string, unknown>) =>
  imageValues(body).some(isImageReference);

// An unchanged dashboard image URL must never replace its own stored image bytes.
// Resolve gallery references against the original record, before any reordering.
export function resolveProductImageReferences(
  body: Record<string, unknown>,
  record: any,
) {
  const product = toClientProduct(record);
  const resolve = (value: unknown) => {
    if (!isImageReference(value)) return value;
    const url = new URL(value, "https://techai.invalid");
    if (
      url.pathname !== `/api/products/${encodeURIComponent(product.id)}/image`
    )
      throw new Error("Image references must belong to this product.");
    const field = url.searchParams.get("field") || "image";
    const original = /^(?:0|[1-9]\d?)$/.test(field)
      ? product.images?.[Number(field)]
      : field === "image" ||
          field === "originalImage" ||
          field === "normalizedImage"
        ? product[field]
        : undefined;
    if (!original || isImageReference(original))
      throw new Error(
        "The original image is unavailable. Reload the product before saving.",
      );
    return original;
  };
  const result = { ...body };
  for (const field of ["image", "originalImage", "normalizedImage"] as const)
    if (field in result) result[field] = resolve(result[field]);
  if (Array.isArray(result.images)) result.images = result.images.map(resolve);
  return result;
}
