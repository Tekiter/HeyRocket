import { createApp } from "./app";

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = createApp({
      botToken: env.BOT_TOKEN,
      d1db: env.DB,
    });

    return app.fetch(request, env, ctx);
  },
};
