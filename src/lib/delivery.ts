type Coordinates = { latitude: number; longitude: number };

export type DeliveryQuote = {
  distanceKm: number | null;
  customerFee: number;
  driverPayout: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function haversineDistance(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeCep(cep: string): Promise<Coordinates | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
      signal: AbortSignal.timeout(5000),
      cache: "force-cache",
    });
    if (!response.ok) return null;
    const data = await response.json();
    const longitude = Number(data?.location?.coordinates?.longitude);
    const latitude = Number(data?.location?.coordinates?.latitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}

async function geocodeAddress(address: string | undefined, cep: string) {
  if (address?.trim()) {
    try {
      const query = encodeURIComponent(`${address}, ${cep}, Brasil`);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${query}`, {
        headers: { "User-Agent": "HamburgueriaPrime/1.0 (delivery quote)" },
        signal: AbortSignal.timeout(5000),
        cache: "force-cache",
      });
      if (response.ok) {
        const data = await response.json();
        const latitude = Number(data?.[0]?.lat);
        const longitude = Number(data?.[0]?.lon);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
      }
    } catch {
      // Usa o CEP como fallback quando a busca pelo endereço completo falhar.
    }
  }
  return geocodeCep(cep);
}

async function roadDistance(from: Coordinates, to: Coordinates) {
  try {
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    const meters = Number(data?.routes?.[0]?.distance);
    return Number.isFinite(meters) ? meters / 1000 : null;
  } catch {
    return null;
  }
}

export async function calculateDeliveryQuote(input: {
  storeCep: string;
  customerCep: string;
  storeAddress?: string;
  customerAddress?: string;
  baseFee: number;
  feePerKm: number;
  freeDeliveryThreshold: number | null;
  subtotal: number;
}) {
  const [store, customer] = await Promise.all([
    geocodeAddress(input.storeAddress, input.storeCep),
    geocodeAddress(input.customerAddress, input.customerCep),
  ]);
  if (!store || !customer) return null;

  const routeKm = await roadDistance(store, customer);
  const distanceKm = Math.max(routeKm ?? haversineDistance(store, customer) * 1.3, 0);
  const driverPayout = roundMoney(input.baseFee + distanceKm * input.feePerKm);
  const qualifiesForFreeDelivery = input.freeDeliveryThreshold != null
    && input.subtotal >= input.freeDeliveryThreshold;

  return {
    coordinates: customer,
    quote: {
      distanceKm: Math.round(distanceKm * 10) / 10,
      customerFee: qualifiesForFreeDelivery ? 0 : driverPayout,
      driverPayout,
    } satisfies DeliveryQuote,
  };
}
