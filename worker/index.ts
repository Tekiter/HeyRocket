import { Hono } from "hono";
import { z } from "zod";
import { createAmountManager } from "./amountManager";
import { App } from "./app";
import { createD1Store } from "./store/d1/d1Store";
import { getEndOfToday } from "./util";
import { ConversationsSelectAction, SlackApp } from "slack-cloudflare-workers";
import { adminApiRoute } from "./api/admin";

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
  EMOJI: string;
  TODAY_QUOTA: string;
  ADMIN_SECRET_KEY: string;
  INTERNAL_API_KEY: string;
  SLACK_SIGNING_SECRET: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const server = new Hono();

    const slackApp = new SlackApp({
      env: {
        SLACK_SIGNING_SECRET: env.SLACK_SIGNING_SECRET,
        SLACK_BOT_TOKEN: env.BOT_TOKEN,
      },
    });

    const store = createD1Store(env.DB, getEndOfToday);
    const amountManager = createAmountManager({
      store,
      maxAmount: parseInt(env.TODAY_QUOTA, 10),
    });

    const app = new App(amountManager, slackApp.client, env.EMOJI);

    slackApp
      .action("refresh_home_tab", async ({ payload }) => {
        await app.updateHomeTab(payload.user.id);
      })
      .action(
        "add_bot_to_channel",
        async () => {},
        async ({ payload }) => {
          const action = payload.actions.find(
            (action): action is ConversationsSelectAction =>
              action.type === "conversations_select"
          );
          if (!action) {
            return;
          }

          await app.inviteBotToChannel(
            action.selected_conversation,
            payload.user.id
          );
        }
      )
      .event("app_home_opened", async ({ payload }) => {
        const { user, tab } = payload;

        if (tab === "home") {
          await app.updateHomeTab(user);
          await store.commit();
        }
      })
      .event("message", async ({ payload }) => {
        if (payload.subtype === undefined) {
          const { text, bot_id, channel, user, thread_ts } = payload;

          if (!!bot_id || !text) {
            return;
          }
          await app.handleUserChat(user, text, channel, thread_ts);
          await store.commit();
        }
      });

    server.all("/slack/events", async (c) => {
      console.log("Getting Slack Request");
      return await slackApp.run(c.req.raw, ctx);
    });

    server.route(
      "/api",
      adminApiRoute({
        checkIsAdmin: (key) => key === env.ADMIN_SECRET_KEY,
        store,
      })
    );

    server.get("/health", (c) => {
      return c.text("OK");
    });

    server.onError((err, c) => {
      console.log(err.message, err.stack);
      return c.json({ message: err.message }, 500);
    });

    return server.fetch(request, env, ctx);
  },
};
