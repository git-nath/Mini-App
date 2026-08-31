/// <reference types="google.maps" />

const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsPromise: Promise<void> | null = null;

export const isGooglePlacesConfigured = Boolean(googleMapsKey);

function loadGoogleMaps(): Promise<void> {
  if ((window.google?.maps as unknown as { importLibrary?: unknown })?.importLibrary) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const googleGlobal = (window.google ??= {} as any) as any;
    const maps = (googleGlobal.maps ??= {}) as any;
    const libraries = new Set<string>();
    const load = () => new Promise<void>((resolveLoad, rejectLoad) => {
      const script = document.createElement("script");
      const params = new URLSearchParams({ key: googleMapsKey, v: "weekly" });
      params.set("libraries", [...libraries].join(","));
      params.set("callback", "google.maps.__ib__");
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => rejectLoad(new Error("Google Places could not be loaded."));
      maps.__ib__ = resolveLoad;
      document.head.appendChild(script);
    });

    maps.importLibrary = (library: string) => {
      libraries.add(library);
      return load().then(() => maps.importLibrary(library));
    };
    maps.importLibrary("places").then(resolve).catch(reject);
  });

  return googleMapsPromise;
}

export type PlaceSuggestion = {
  id: string;
  name: string;
};

export async function searchGooglePlaces(input: string): Promise<PlaceSuggestion[]> {
  if (!googleMapsKey || input.trim().length < 2) return [];

  await loadGoogleMaps();
  const places = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
  if (!places?.AutocompleteService) throw new Error("Google Places library is unavailable.");

  const service = new places.AutocompleteService();
  return new Promise((resolve, reject) => {
    service.getPlacePredictions({
      input: input.trim(),
      componentRestrictions: { country: "et" },
      types: ["geocode"],
    }, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK && status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        reject(new Error(`Google Places request failed: ${status}`));
        return;
      }
      resolve((predictions ?? []).slice(0, 5).map((prediction) => ({ id: prediction.place_id, name: prediction.description })));
    });
  });
}
