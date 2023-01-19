import { AmountStore } from "./store/types";

export type AmountManager = ReturnType<typeof createAmountManager>;

interface AmountManagerOptions {
  store: AmountStore;
  maxAmount: number;
}

export function createAmountManager({
  store,
  maxAmount,
}: AmountManagerOptions) {
  return {
    maxAmount,
    async getTodayRemaining(userId: string) {
      const { sent } = await store.getToday(userId);
      return maxAmount - sent;
    },
    async getTotal(userId: string) {
      return await store.getTotal(userId);
    },
    async give(from: string, to: string, amount: number) {
      const { sent: fromSent } = await store.getTotal(from);
      const { received: toReceived } = await store.getTotal(to);
      const { sent: fromSentToday } = await store.getToday(from);

      const newToReceived = toReceived + amount;
      const newFromSent = fromSent + amount;
      const newFromSentToday = fromSentToday + amount;

      if (from === to || newFromSentToday > maxAmount) {
        return {
          success: false,
          fromSent,
          toReceived,
          fromRemainingToday: maxAmount - fromSentToday,
        };
      }

      await store.setTotal(from, {
        sent: newFromSent,
      });
      await store.setToday(from, {
        sent: newFromSentToday,
      });
      await store.setTotal(to, {
        received: newToReceived,
      });

      return {
        success: true,
        fromSent: newFromSent,
        toReceived: newToReceived,
        fromRemainingToday: maxAmount - newFromSentToday,
      };
    },
    async getTotalRanking() {
      const topReceived = await store.getTotalRank(10, "received");
      const topSent = await store.getTotalRank(10, "sent");

      return { topReceived, topSent };
    },
  };
}
