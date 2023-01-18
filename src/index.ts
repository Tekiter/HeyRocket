import { Hono } from "hono";
import { createAmountManager } from "./amountManager";
import { extract } from "./extractMessage";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";
import { createKVStore } from "./store/kv/kvStore";

export interface Env {
  data: KVNamespace;
  BOT_TOKEN: string;
}

const TODAY_QUOTA = 5;
const EMOJI = ":rocket:";

const app = new Hono<{ Bindings: Env }>();

app.post("/event", async (c) => {
  const data = await c.req.json();

  const handler = createSlackEventHandler();
  const client = createSlackWebClient({ botToken: c.env.BOT_TOKEN });
  const store = createKVStore(c.env.data);
  const amountManager = createAmountManager({ store, maxAmount: TODAY_QUOTA });

  handler.onEvent("message", async (payload) => {
    if (payload.subtype === undefined) {
      const { text, bot_id, channel, user, ts } = payload;

      if (!!bot_id || !text) {
        return;
      }

      const extracted = extract(text, EMOJI);
      if (!extracted) {
        return;
      }
      const { mentions, count } = extracted;

      for (const target of mentions) {
        const { success, fromTodayRemaining, toAmount } =
          await amountManager.give(user, target, count);

        if (!success) {
          await client.request("chat.postEphemeral", {
            text: `${mentions
              .map((user) => `<@${user}>`)
              .join(
                ", "
              )} 에게 ${EMOJI} ${count}개를 더 보낼 수 없어요! (오늘의 남은 개수: ${fromTodayRemaining})`,
            user,
            channel,
            thread_ts: ts,
          });
          continue;
        }

        await client.request("chat.postEphemeral", {
          text: `${mentions
            .map((user) => `<@${user}>`)
            .join(
              ", "
            )} 에게 ${EMOJI}을 ${count}개 보냈어요! (오늘의 남은 개수: ${fromTodayRemaining})`,
          user,
          channel,
          thread_ts: ts,
        });

        await client.request("chat.postMessage", {
          text: `<@${user}> 에게서 ${EMOJI} ${count}개를 받았어요! 지금까지 받은 ${EMOJI}는 총 ${toAmount}개에요.`,
          channel: target,
        });
      }
    }
  });

  const response = await handler.handle(data);
  await store.commit();

  return c.json(response, 200);
});

app.get("/", (c) => c.text("Hello World!"));

export default app;
