import { Hono } from "hono";
import { z } from "zod";
import { AmountStore } from "../store/types";

const ADMIN_KEY_HEADER = "X-Admin-Key";

export const adminApiRoute = ({
  checkIsAdmin,
  store,
}: {
  checkIsAdmin: (key: string) => boolean;
  store: AmountStore;
}) => {
  return new Hono()
    .get("/v1/admin/check", async (c) => {
      const adminKey = c.req.header(ADMIN_KEY_HEADER);
      if (!adminKey || !checkIsAdmin(adminKey)) {
        return c.json("Unauthorized", 401);
      }

      return c.json({ success: true });
    })
    .post("/v1/admin/finish-season", async (c) => {
      const adminKey = c.req.header(ADMIN_KEY_HEADER);
      if (!adminKey || !checkIsAdmin(adminKey)) {
        return c.json("Unauthorized", 401);
      }

      const bodySchema = z.object({
        seasonName: z.string(),
      });

      const data = await c.req.json();
      const ret = bodySchema.safeParse(data);
      if (!ret.success) {
        return c.json({ error: ret.error.format() }, 400);
      }

      console.log("Resetting Season...", ret.data.seasonName);
      await store.finishSeason(ret.data.seasonName);
      return c.json({ success: true });
    });
};
