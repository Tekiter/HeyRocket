import { Hono } from "hono";
import { getMentions, getNiddleCount } from "./extractMessage";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";

export interface Env {
  data: KVNamespace;
  BOT_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post("/event", async (c) => {
  const data = await c.req.json();

  const handler = createSlackEventHandler();
  const client = createSlackWebClient({ botToken: c.env.BOT_TOKEN });

  handler.onEvent("message", async (payload) => {
    if (payload.subtype === undefined) {
      const { text, bot_id, channel } = payload;

      if (!!bot_id || !text) {
        return;
      }

      const count = getNiddleCount(text, ":rocket:");

      if (count == 0) {
        return;
      }

      const mentions = getMentions(text);

      await client.request("chat.postMessage", {
        text: `로켓이 ${count} 개!! MENTIONS: ${mentions.join(", ")}`,
        channel,
      });
    }
  });

  const response = await handler.handle(data);

  return c.json(response, 200);
});

app.get("/", (c) => c.text("Hello World!"));

export default app;
