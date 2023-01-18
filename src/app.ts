import endOfDay from "date-fns/endOfDay";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { Hono } from "hono";
import { createAmountManager } from "./amountManager";
import { extract } from "./extractMessage";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";
import { createD1Store } from "./store/d1/d1Store";

interface AppDeps {
  botToken: string;
  d1db: D1Database;
}

const TODAY_QUOTA = 5;
const EMOJI = ":rocket:";

export function createApp({ botToken, d1db }: AppDeps) {
  const app = new Hono();

  app.post("/event", async (c) => {
    const data = await c.req.json();

    const getEndOfToday = () => {
      const zone = "Asia/Seoul";
      return zonedTimeToUtc(endOfDay(utcToZonedTime(new Date(), zone)), zone);
    };

    const handler = createSlackEventHandler();
    const client = createSlackWebClient({ botToken });
    const store = createD1Store(d1db, getEndOfToday);
    const amountManager = createAmountManager({
      store,
      maxAmount: TODAY_QUOTA,
    });

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
                )} 에게 ${EMOJI} ${count}개를 더 보낼 수 없어요! 오늘은 ${fromTodayRemaining}개만 더 보낼 수 있어요.`,
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
              )} 에게 ${EMOJI}을 ${count}개 보냈어요! 오늘 ${fromTodayRemaining}개를 더 보낼 수 있어요.`,
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

  return app;
}
