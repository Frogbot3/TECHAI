export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function pagination(params: URLSearchParams, defaultLimit = 50, maxLimit = 200) {
  const integer = (value: string | null, fallback: number, max: number) => {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback;
  };
  return { page: integer(params.get("page"), 1, 10000), limit: integer(params.get("limit"), defaultLimit, maxLimit) };
}
