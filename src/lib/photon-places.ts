export type PlaceSuggestion = {
  id: string;
  name: string;
};

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  type?: string;
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function formatPlace(feature: PhotonFeature) {
  const properties = feature.properties ?? {};
  const primary = properties.name ?? properties.street;
  if (!primary) return "";

  const street = properties.street && properties.street !== primary
    ? `${properties.housenumber ? `${properties.housenumber} ` : ""}${properties.street}`
    : "";
  const context = [street, properties.district, properties.city, properties.state, properties.country]
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index);

  return [primary, ...context].join(", ");
}

export async function searchPlaces(input: string): Promise<PlaceSuggestion[]> {
  const query = input.trim();
  if (query.length < 2) return [];

  const params = new URLSearchParams({ q: query, limit: "5", countrycode: "ET", lang: "en" });
  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
  if (!response.ok) throw new Error(`Address search failed (${response.status}).`);

  const data = await response.json() as PhotonResponse;
  return (data.features ?? [])
    .map((feature, index) => ({
      id: `${feature.type ?? "place"}-${index}-${formatPlace(feature)}`,
      name: formatPlace(feature),
    }))
    .filter((place): place is PlaceSuggestion => Boolean(place.name));
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<PlaceSuggestion | null> {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), limit: "1", lang: "en" });
  const response = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`);
  if (!response.ok) throw new Error(`Current location lookup failed (${response.status}).`);

  const data = await response.json() as PhotonResponse;
  const feature = data.features?.[0];
  const name = feature ? formatPlace(feature) : "";
  return feature && name
    ? { id: `current-${latitude}-${longitude}`, name }
    : null;
}
