import type { DeliveryAddress } from "./driver";
import { navigationStreet } from "./driver";
// Require an exact house-number match; CEP fallback is unsuitable for routing stops.
export async function exactDeliveryPoint(address: DeliveryAddress) {
  if (address.navigationLatitude != null && address.navigationLongitude != null)
    return {
      latitude: address.navigationLatitude,
      longitude: address.navigationLongitude,
    };
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "3");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set(
    "street",
    `${address.number} ${navigationStreet(address)}`,
  );
  url.searchParams.set("city", address.city);
  url.searchParams.set("state", address.state);
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^(rua|r\.|avenida|av\.)\s+/, "")
      .replace(/[^a-z0-9]/g, "");
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "HamburgueriaPrime/1.0 (delivery navigation)" },
      cache: "force-cache",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const rows = await response.json();
    if (!Array.isArray(rows)) return null;
    const match = rows.find(
      (r) =>
        normalize(String(r.address?.house_number ?? "")) ===
          normalize(address.number) &&
        normalize(r.address?.road ?? "") ===
          normalize(navigationStreet(address)) &&
        normalize(
          r.address?.city ?? r.address?.town ?? r.address?.municipality ?? "",
        ) === normalize(address.city),
    );
    if (!match) return null;
    const latitude = Number(match.lat),
      longitude = Number(match.lon);
    return Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180
      ? { latitude, longitude }
      : null;
  } catch {
    return null;
  }
}
