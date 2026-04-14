import { NextRequest } from "next/server";
import { adminStore, getActiveBroadcast } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately on connect — only active broadcast
      const init = `event: init\ndata: ${JSON.stringify({
        toggles: adminStore.toggles,
        broadcast: getActiveBroadcast(),
      })}\n\n`;
      controller.enqueue(encoder.encode(init));

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      // Register SSE client
      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(msg));
        } catch {
          adminStore.sseClients.delete(send);
        }
      };
      adminStore.sseClients.add(send);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        adminStore.sseClients.delete(send);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
