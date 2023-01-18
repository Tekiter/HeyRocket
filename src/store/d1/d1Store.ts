import { AmountStore } from "../types";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export function createD1Store(
  d1db: D1Database,
  getEndOfToday: () => Date
): AmountStore {
  const db = new Kysely<Database>({
    dialect: new D1Dialect({ database: d1db }),
  });

  return {
    async getTodayUsed(userId) {
      const user = await db
        .selectFrom("today")
        .where("user_id", "=", userId)
        .select(["amount", "expire"])
        .executeTakeFirst();

      if (!user) {
        return 0;
      }
      if (dateToInt(new Date()) > user.expire) {
        await db.deleteFrom("today").where("user_id", "=", userId).execute();
        return 0;
      }

      return user.amount;
    },
    async setTodayUsed(userId, amount) {
      const expire = dateToInt(getEndOfToday());

      await db
        .insertInto("today")
        .values({
          user_id: userId,
          amount,
          expire,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            amount,
            expire,
          })
        )
        .execute();
    },
    async getTotal(userId) {
      const user = await db
        .selectFrom("total")
        .where("user_id", "=", userId)
        .select(["amount"])
        .executeTakeFirst();

      if (!user) {
        return 0;
      }

      return user.amount;
    },
    async setTotal(userId, amount) {
      await db
        .insertInto("total")
        .values({
          user_id: userId,
          amount,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            amount,
          })
        )
        .execute();
    },
    async commit() {},
  };
}

interface Database {
  total: {
    user_id: string;
    amount: number;
  };
  today: {
    user_id: string;
    amount: number;
    expire: number;
  };
}

function dateToInt(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function intToDate(val: number) {
  return new Date(val);
}
