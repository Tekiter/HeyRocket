import { Hono } from "hono";
import { createAmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";
import {
  canNotSendMoreMessage,
  rankRecordMessage,
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

    handler.onEvent("app_home_opened", async (payload) => {
      const { user, tab } = payload;

      const { topReceived, topSent } = await amountManager.getTotalRanking();

      if (tab === "home") {
        await client.request("views.publish", {
          user_id: user,
          view: {
            type: "home",
            blocks: [
              {
                type: "divider",
              },
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "전체 기간 랭킹",
                },
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*받은 개수*\n${topReceived
                      .map(({ user, received }, idx) =>
                        rankRecordMessage(idx + 1, user, received, emoji)
                      )
                      .join("\n")}`,
                  },
                  {
                    type: "mrkdwn",
                    text: `*보낸 개수*\n${topSent
                      .map(({ user, sent }, idx) =>
                        rankRecordMessage(idx + 1, user, sent, emoji)
                      )
                      .join("\n")}`,
                  },
                ],
              },
              {
                type: "divider",
              },
            ],
          },
        });
      }
    });

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

          const { success, fromRemainingToday, toReceived } =
            await amountManager.give(user, target, count);

          if (!success) {
            await client.request("chat.postEphemeral", {
              text: canNotSendMoreMessage(
                target,
                emoji,
                count,
                fromRemainingToday
              ),
              user,
              channel,
              thread_ts,
            });
            continue;
          }

          await client.request("chat.postEphemeral", {
            text: sentSuccessMessage(target, emoji, count, fromRemainingToday),
            user,
            channel,
            thread_ts,
          });

          await client.request("chat.postMessage", {
            text: receivedMessage(user, emoji, count, toReceived),
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
