/// <reference types="google.maps" />

const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsPromise: Promise<void> | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | undefined;

export const isGooglePlacesConfigured = Boolean(googleMapsKey);

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Places could not be loaded."));
    document.head.appendChild(script);
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
