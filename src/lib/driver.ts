export type DeliveryAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  complement: string | null;
  reference: string | null;
};
export type DriverOrder = {
  id: string;
  number: number;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentCardBrand: string | null;
  changeFor: number | null;
  notes: string | null;
  user: { name: string; phone: string | null };
  address: DeliveryAddress | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    addonsLabel: string | null;
    removedLabel: string | null;
    notes: string | null;
  }[];
};
export function deliveryAddress(address: DeliveryAddress) {
  return `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}, ${address.cep}, Brasil`;
}
export function mapsRoute(destinations: string[], origin?: string) {
  if (!destinations.length || destinations.length > 4)
    throw new Error("Selecione de uma a quatro paradas por trecho.");
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("travelmode", "driving");
  if (origin) url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destinations.at(-1)!);
  if (destinations.length > 1)
    url.searchParams.set("waypoints", destinations.slice(0, -1).join("|"));
  return url.toString();
}
// Mobile browsers support three intermediate waypoints. Never silently drop stops.
export function mapsRouteSections(
  stops: { id: string; address: string }[],
  origin?: string,
) {
  const sections: { url: string; ids: string[] }[] = [];
  for (let i = 0; i < stops.length;) {
    let count = Math.min(4, stops.length - i);
    while (
      count > 1 &&
      mapsRoute(
        stops.slice(i, i + count).map((s) => s.address),
        origin,
      ).length > 2000
    )
      count--;
    const batch = stops.slice(i, i + count);
    const url = mapsRoute(
      batch.map((s) => s.address),
      origin,
    );
    if (url.length > 2048)
      throw new Error("Endereço muito longo para abrir no Maps.");
    sections.push({ url, ids: batch.map((s) => s.id) });
    origin = batch.at(-1)!.address;
    i += count;
  }
  return sections;
}
// Exact open-path optimization using directed road travel times; endpoint is free.
export function fastestStopOrder(matrix: number[][]): number[] {
  const n = matrix.length - 1;
  if (
    n < 1 ||
    n > 10 ||
    matrix.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== n + 1 ||
        row.some((v) => !Number.isFinite(v) || v < 0),
    )
  )
    throw new Error("Não foi possível calcular todas as paradas.");
  const costs = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity));
  const previous = Array.from({ length: 1 << n }, () => Array(n).fill(-1));
  for (let i = 0; i < n; i++) costs[1 << i][i] = matrix[0][i + 1];
  for (let mask = 1; mask < 1 << n; mask++)
    for (let last = 0; last < n; last++) {
      if (!(mask & (1 << last))) continue;
      for (let next = 0; next < n; next++)
        if (!(mask & (1 << next))) {
          const candidate = costs[mask][last] + matrix[last + 1][next + 1],
            nextMask = mask | (1 << next);
          if (candidate < costs[nextMask][next]) {
            costs[nextMask][next] = candidate;
            previous[nextMask][next] = last;
          }
        }
    }
  let mask = (1 << n) - 1,
    last = costs[mask].indexOf(Math.min(...costs[mask]));
  const order: number[] = [];
  while (last !== -1) {
    order.push(last);
    const before = previous[mask][last];
    mask ^= 1 << last;
    last = before;
  }
  return order.reverse();
}
