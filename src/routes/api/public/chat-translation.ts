import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const input = z.object({ messageId: z.string().uuid(), language: z.string().max(5) });
const headers = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type, authorization", "cache-control": "no-store" };
export const Route = createFileRoute("/api/public/chat-translation")({
  server: { handlers: {
    OPTIONS: async () => new Response(null, { status: 204, headers }),
    POST: async ({ request }) => {
      try {
        const data = input.parse(await request.json());
        const { translateChatMessage } = await import("@/lib/chat-translation.server");
        return Response.json(await translateChatMessage(request, data.messageId, data.language), { headers });
      } catch {
        return Response.json({ status: "failed", error: "Translation unavailable or access denied." }, { status: 400, headers });
      }
    },
  } },
});