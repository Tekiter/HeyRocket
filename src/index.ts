import { createApp } from "./app";
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
    const store = createD1Store(env.DB, getEndOfToday);

    const app = createApp({
      botToken: env.BOT_TOKEN,
      store: store,
      emoji: env.EMOJI,
      todayQuota: parseInt(env.TODAY_QUOTA, 10),
    });

    return app.fetch(request, env, ctx);
  },
};
