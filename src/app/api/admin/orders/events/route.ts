import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { orderEvents, OrderEventPayload } from "@/lib/order-events";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Não autorizado", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (payload: OrderEventPayload) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const listener = (payload: OrderEventPayload) => {
        if (payload.restaurantId === session.user.restaurantId) send(payload);
      };
      orderEvents.on("order-event", listener);

      // Heartbeat para manter a conexão viva atrás de proxies/load balancers
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        orderEvents.off("order-event", listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
