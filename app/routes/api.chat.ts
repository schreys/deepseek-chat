import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import ollama from "ollama";
import { Message } from "~/types";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { messages, model } = await request.json();

    const stream = await ollama.chat({
      model,
      messages: messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
    });

    const stream_response = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              new TextEncoder().encode(JSON.stringify(chunk) + "\n")
            );
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream_response, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
