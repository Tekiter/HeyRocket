import { AmountStore } from "../types";
import { createListStore } from "./listStore";

export function createKVStore(kv: KVNamespace): AmountStore {
  const total = createListStore<User>(kv, "data:total");
  const today = createListStore<User>(kv, "data:today");

  return {
    async getTotal(userId) {
      const user = await total.getById(userId);
      if (!user) {
        return 0;
      }
      return user.count;
    },
    async setTotal(userId, amount) {
      const user = await total.getById(userId);
      if (!user) {
        total.setById(userId, {
          count: amount,
        });
        return;
      }
      total.setById(userId, {
        ...user,
        count: amount,
      });
    },
    async getTodayUsed(userId) {
      const user = await today.getById(userId);
      if (!user) {
        return 0;
      }
      return user.count;
    },
    async setTodayUsed(userId, amount) {
      const user = await today.getById(userId);
      if (!user) {
        today.setById(userId, {
          count: amount,
        });
        return;
      }
      today.setById(userId, {
        ...user,
        count: amount,
      });
    },
    async commit() {
      await Promise.allSettled([today.commit(), total.commit()]);
    },
  };
}

interface User {
  count: number;
}
