import { Hono } from "hono";
import { createAmountManager } from "./amountManager";
import { App } from "./app";
import { createSlackActionHandler } from "./slack/action";
import { createSlackEventHandler } from "./slack/event";
import { createSlackWebClient } from "./slack/webapi";
import { createD1Store } from "./store/d1/d1Store";
import { getEndOfToday } from "./util";

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
  EMOJI: string;
  TODAY_QUOTA: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const server = new Hono();

    const store = createD1Store(env.DB, getEndOfToday);
    const client = createSlackWebClient({ botToken: env.BOT_TOKEN });
    const amountManager = createAmountManager({
      store,
      maxAmount: parseInt(env.TODAY_QUOTA, 10),
    });

    const app = new App(amountManager, client, env.EMOJI);

    server.post("/action", async (c) => {
      const data = await c.req.parseBody<{ payload: string }>();
      const handler = createSlackActionHandler();
      const payload = JSON.parse(data.payload) as unknown;

      handler.onBlockAction("button", async (action, { user }) => {
        if (action.action_id === "refresh_home_tab") {
          await app.updateHomeTab(user.id);
        }
      });

      handler.onBlockAction(
        "conversations_select",
        async (action, { user }) => {
          if (action.action_id === "add_bot_to_channel") {
            await app.inviteBotToChannel(action.selected_conversation, user.id);
          }
        }
      );

      await handler.handle(payload);

      return c.json(null, 200);
    });

    server.post("/event", async (c) => {
      const data = await c.req.json();
      const handler = createSlackEventHandler();

      handler.onEvent("app_home_opened", async (payload) => {
        const { user, tab } = payload;

        if (tab === "home") {
          await app.updateHomeTab(user);
        }
      });

      handler.onEvent("message", async (payload) => {
        if (payload.subtype === undefined) {
          const { text, bot_id, channel, user, thread_ts } = payload;

          if (!!bot_id || !text) {
            return;
          }
          ctx.waitUntil(app.handleUserChat(user, text, channel, thread_ts));
        }
      });

      const response = await handler.handle(data);
      await store.commit();

      return c.json(response, 200);
    });

    return server.fetch(request, env, ctx);
  },
};
