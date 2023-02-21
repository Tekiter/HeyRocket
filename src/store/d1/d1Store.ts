import { AmountStore } from "../types";
import { Generated, Kysely, sql } from "kysely";
import { D1Dialect } from "kysely-d1";

export function createD1Store(
  d1db: D1Database,
  getEndOfToday: () => Date
): AmountStore {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: d1db }),
  });

  return {
    async getTotal(userId) {
      const user = await db
        .selectFrom("total")
        .where("user_id", "=", userId)
        .select(["received", "sent"])
        .executeTakeFirst();

      if (!user) {
        return {
          received: 0,
          sent: 0,
        };
      }

      return {
        received: user.received,
        sent: user.sent,
      };
    },
    async setTotal(userId, amount) {
      await db
        .insertInto("total")
        .values({
          user_id: userId,
          sent: amount.sent ?? 0,
          received: amount.received ?? 0,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            sent: amount.sent,
            received: amount.received,
          })
        )
        .execute();
    },
    async incTotal(userId, delta) {
      const { received, sent } = await db
        .insertInto("total")
        .values({
          user_id: userId,
          sent: delta.sent ?? 0,
          received: delta.received ?? 0,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            received: sql`received + ${delta.received ?? 0}`,
            sent: sql`sent + ${delta.sent ?? 0}`,
          })
        )
        .returning(["received", "sent"])
        .executeTakeFirstOrThrow();

      return {
        received,
        sent,
      };
    },

    async getToday(userId) {
      const user = await db
        .selectFrom("today")
        .where("user_id", "=", userId)
        .select(["expire", "received", "sent"])
        .executeTakeFirst();

      if (!user) {
        return {
          sent: 0,
          received: 0,
        };
      }
      if (dateToInt(new Date()) > user.expire) {
        await db.deleteFrom("today").where("user_id", "=", userId).execute();
        return {
          sent: 0,
          received: 0,
        };
      }

      return {
        sent: user.sent,
        received: user.received,
      };
    },
    async setToday(userId, amount) {
      const expire = dateToInt(getEndOfToday());

      await db
        .insertInto("today")
        .values({
          user_id: userId,
          received: amount.received ?? 0,
          sent: amount.sent ?? 0,
          expire,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            received: amount.received,
            sent: amount.sent,
            expire,
          })
        )
        .execute();
    },
    async incToday(userId, delta, maxAmount) {
      const expire = dateToInt(getEndOfToday());

      const result = await db
        .insertInto("today")
        .values({
          user_id: userId,
          received: 0,
          sent: 0,
          expire,
        })
        .onConflict((oc) => {
          let q = oc.doUpdateSet({
            received: sql`received + ${delta.received ?? 0}`,
            sent: sql`sent + ${delta.sent ?? 0}`,
          });

          if (maxAmount?.received !== undefined) {
            q = q.where(
              sql`received + ${delta.received ?? 0}`,
              "<=",
              maxAmount.received
            );
          }
          if (maxAmount?.sent !== undefined) {
            q = q.where(sql`sent + ${delta.sent ?? 0}`, "<=", maxAmount.sent);
          }

          return q;
        })
        .returning(["received", "sent"])
        .executeTakeFirst();

      if (!result) {
        return null;
      }

      return {
        received: result.received,
        sent: result.sent,
      };
    },
    async getTotalRank(limit, type) {
      const records = await db
        .selectFrom("total")
        .where(type, "!=", 0)
        .orderBy(type, "desc")
        .limit(limit)
        .select(["user_id", "received", "sent"])
        .execute();

      return records.map((record) => ({
        user: record.user_id,
        sent: record.sent,
        received: record.received,
      }));
    },
    async getSeasonList() {
      const list = await db
        .selectFrom("seasons")
        .select(["name", "season_id"])
        .execute();

      return list.map((row) => ({
        id: row.season_id,
        name: row.name,
      }));
    },
    async getSeasonRank(seasonId, limit, type) {
      return [];
    },
    async finishSeason(name) {
      const { season_id: seasonId } = await db
        .insertInto("seasons")
        .values({ name })
        .returning(["season_id", "name"])
        .executeTakeFirstOrThrow();

      await db
        .insertInto("backlog")
        .columns(["user_id", "sent", "received", "season_id"])
        .expression((eb) =>
          eb
            .selectFrom("total")
            .select([
              "user_id",
              "sent",
              "received",
              sql`${seasonId}`.as("season_id"),
            ])
        )
        .execute();

      await db.deleteFrom("total").execute();
      await db.deleteFrom("today").execute();
    },
    async commit() {},
  };
}

interface Database {
  total: {
    user_id: string;
    sent: number;
    received: number;
  };
  today: {
    user_id: string;
    sent: number;
    received: number;
    expire: number;
  };
  backlog: {
    user_id: string;
    sent: number;
    received: number;
    season_id: number;
  };
  seasons: {
    season_id: Generated<number>;
    name: string;
  };
}

function dateToInt(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function intToDate(val: number) {
  return new Date(val);
}
