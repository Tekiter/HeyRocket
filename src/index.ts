import { Hono } from "hono";
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

  handler.onEvent("message", async ({}) => {
    console.log(
      await client.request("chat.postMessage", {
        text: "Hello world!",
        channel: "#hey-workers",
      })
    );
  });

  const response = await handler.handle(data);

  return c.json(response, 200);
});

export default app;
