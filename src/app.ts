import endOfDay from "date-fns/endOfDay";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { Hono } from "hono";
import { createAmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";
import { createD1Store } from "./store/d1/d1Store";
import {
  canNotSendMoreMessage,
  receivedMessage,
  sentSuccessMessage,
} from "./messages";
import { uniq } from "./util";
import { AmountStore } from "./store/types";

interface AppDeps {
  botToken: string;
  store: AmountStore;
  emoji: string;
  todayQuota: number;
}

export function createApp({ botToken, store, emoji, todayQuota }: AppDeps) {
  const app = new Hono();

  const handler = createSlackEventHandler();
  const client = createSlackWebClient({ botToken });

  const amountManager = createAmountManager({
    store,
    maxAmount: todayQuota,
  });

  app.post("/event", async (c) => {
    const data = await c.req.json();

    handler.onEvent("message", async (payload) => {
      if (payload.subtype === undefined) {
        const { text, bot_id, channel, user, thread_ts } = payload;

        if (!!bot_id || !text) {
          return;
        }

        const { success, mentions, count } = extractTarget(text, emoji);
        if (!success) {
          return;
        }

        const targets = uniq(mentions);

        for (const target of targets) {
          if (user === target) {
            continue;
          }

          const { success, fromTodayRemaining, toAmount } =
            await amountManager.give(user, target, count);

          if (!success) {
            await client.request("chat.postEphemeral", {
              text: canNotSendMoreMessage(
                mentions,
                emoji,
                count,
                fromTodayRemaining
              ),
              user,
              channel,
              thread_ts,
            });
            continue;
          }

          await client.request("chat.postEphemeral", {
            text: sentSuccessMessage(target, emoji, count, fromTodayRemaining),
            user,
            channel,
            thread_ts,
          });

          await client.request("chat.postMessage", {
            text: receivedMessage(user, emoji, count, toAmount),
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
