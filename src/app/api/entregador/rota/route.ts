import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { geocodeAddress } from "@/lib/delivery";
import { exactDeliveryPoint } from "@/lib/delivery-navigation";
import { fastestStopOrder, navigationDestination } from "@/lib/driver";
import { z } from "zod";
const input = z.object({
  ids: z.array(z.string().min(1).max(100)).min(1).max(10),
  origin: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});
export const maxDuration = 60;
export async function POST(request: Request) {
  const session = await auth();
  if (
    !session?.user?.id ||
    session.user.blocked ||
    session.user.role !== "ENTREGADOR" ||
    !session.user.restaurantId
  )
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ message: "Origem inválida." }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    new Set(parsed.data.ids).size !== parsed.data.ids.length
  )
    return Response.json(
      { message: "Selecione até 10 entregas diferentes." },
      { status: 400 },
    );
  if (
    !(
      await rateLimit("driver-route:" + session.user.id, {
        limit: 6,
        windowMs: 60000,
      })
    ).success
  )
    return Response.json(
      { message: "Aguarde um minuto antes de recalcular." },
      { status: 429 },
    );
  const { ids } = parsed.data,
    restaurantId = session.user.restaurantId;
  const [orders, store] = await Promise.all([
    prisma.order.findMany({
      where: {
        id: { in: ids },
        restaurantId,
        entregadorId: session.user.id,
        deliveryType: "ENTREGA",
        status: { in: ["PREPARANDO", "SAIU_PARA_ENTREGA"] },
      },
      select: { id: true, number: true, address: true },
    }),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { address: true, storeCep: true },
    }),
  ]);
  if (orders.length !== ids.length || orders.some((o) => !o.address))
    return Response.json(
      {
        message:
          "Alguma entrega não está mais atribuída a você ou está sem endereço. Atualize a lista.",
      },
      { status: 409 },
    );
  if (
    new Set(orders.map((o) => navigationDestination(o.address!))).size === 1
  ) {
    return Response.json(
      {
        ids,
        destinations: Object.fromEntries(
          orders.map((o) => [o.id, navigationDestination(o.address!)]),
        ),
        origin: parsed.data.origin
          ? `${parsed.data.origin.latitude},${parsed.data.origin.longitude}`
          : [store?.address, store?.storeCep, "Brasil"]
              .filter(Boolean)
              .join(", "),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  try {
    const deadline = Date.now() + 35000;
    const origin =
      parsed.data.origin ??
      (await geocodeAddress(
        store?.address ?? undefined,
        store?.storeCep ?? "",
      ));
    if (!origin)
      throw Error(
        "Não foi possível localizar a loja. Use sua localização como ponto de partida.",
      );
    const ordered = ids.map((id) => orders.find((o) => o.id === id)!);
    const points = [origin];
    const destinations: Record<string, string> = {};
    for (const order of ordered) {
      if (Date.now() > deadline)
        throw Error(
          "Alguns endereços demoraram para ser localizados. Organize as paradas manualmente ou tente novamente.",
        );
      const a = order.address!;
      const point = await exactDeliveryPoint(a);
      if (!point)
        throw Error(
          `Confirme o ponto exato no mapa do pedido #${order.number} antes de calcular a sequência. O CEP não será usado como destino alternativo.`,
        );
      destinations[order.id] = `${point.latitude},${point.longitude}`;
      points.push(point);
    }
    const coordinates = points
      .map((p) => `${p.longitude},${p.latitude}`)
      .join(";");
    const response = await fetch(
      `https://router.project-osrm.org/table/v1/driving/${coordinates}?annotations=duration`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) },
    ).catch(() => {
      throw Error(
        "O serviço de rotas está indisponível. Organize as paradas manualmente ou tente novamente.",
      );
    });
    if (!response.ok)
      throw Error(
        "O serviço de rotas está indisponível. Você pode organizar as paradas manualmente.",
      );
    const data = await response.json();
    if (data.code !== "Ok" || !Array.isArray(data.durations))
      throw Error(
        "Não foi possível calcular o percurso. Organize as paradas manualmente.",
      );
    const sequence = fastestStopOrder(data.durations);
    return Response.json(
      {
        ids: sequence.map((i) => ordered[i].id),
        destinations,
        origin: parsed.data.origin
          ? `${origin.latitude},${origin.longitude}`
          : [store?.address, store?.storeCep, "Brasil"]
              .filter(Boolean)
              .join(", "),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível calcular a rota. Tente novamente.",
      },
      { status: 503 },
    );
  }
}
