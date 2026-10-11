// This module is called only after an address-search/location gesture in the browser.
declare global {
  interface Window {
    __techaiMapsPromise?: Promise<typeof google.maps>;
    __techaiMapsReady?: () => void;
    __techaiMapsAuthFailed?: boolean;
    gm_authFailure?: () => void;
  }
}
export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("Maps requires a browser."));
  if (window.__techaiMapsAuthFailed)
    return Promise.reject(
      new Error(
        "Google Maps is unavailable. Enter your address manually or retry after reloading.",
      ),
    );
  if (typeof window.google?.maps?.importLibrary === "function")
    return Promise.resolve(window.google.maps);
  if (window.__techaiMapsPromise) return window.__techaiMapsPromise;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key)
    return Promise.reject(
      new Error(
        "Address search is not configured yet. You can still enter your delivery address manually.",
      ),
    );
  window.__techaiMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "techai-google-maps";
    script.async = true;
    const previousAuthFailure = window.gm_authFailure;
    const fail = () =>
      reject(
        new Error(
          "Google Maps could not load. Check your connection, retry, or enter your address manually.",
        ),
      );
    // Keep a timed-out script registered: injecting another could initialize the SDK twice.
    const timer = window.setTimeout(
      () =>
        reject(
          new Error(
            "Google Maps took too long to load. Reload to retry, or enter your address manually.",
          ),
        ),
      20000,
    );
    window.gm_authFailure = () => {
      window.__techaiMapsAuthFailed = true;
      window.dispatchEvent(new Event("techai-maps-error"));
      clearTimeout(timer);
      fail();
      previousAuthFailure?.();
    };
    window.__techaiMapsReady = () => {
      clearTimeout(timer);
      resolve(window.google.maps);
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      window.__techaiMapsPromise = undefined;
      fail();
    };
    const query = new URLSearchParams({
      key,
      v: "weekly",
      loading: "async",
      callback: "__techaiMapsReady",
      language: "en",
      region: "IN",
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${query}`;
    document.head.appendChild(script);
  });
  return window.__techaiMapsPromise;
}

export async function withMapsTimeout<T>(task: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Address lookup timed out. Please retry or enter your address manually.",
              ),
            ),
          15000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
