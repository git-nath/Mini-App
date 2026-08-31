/// <reference types="google.maps" />

const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsPromise: Promise<void> | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | undefined;

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
  if (!places?.AutocompleteSuggestion) throw new Error("Google Places library is unavailable.");
  sessionToken ??= new places.AutocompleteSessionToken();

  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: input.trim(),
    includedRegionCodes: ["et"],
    language: "en",
    sessionToken,
  });

  return suggestions
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is google.maps.places.PlacePrediction => Boolean(prediction))
    .slice(0, 5)
    .map((prediction) => ({ id: prediction.placeId, name: prediction.text.text }));
}
