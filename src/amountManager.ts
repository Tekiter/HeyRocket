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
      const newFromToday = await store.incToday(
        from,
        { sent: +amount },
        { sent: maxAmount }
      );

      if (!newFromToday) {
        const [
          { sent: fromSent },
          { received: toReceived },
          { sent: fromSentToday },
        ] = await Promise.all([
          store.getTotal(from),
          store.getTotal(to),
          store.getToday(from),
        ]);

        return {
          success: false,
          fromSent,
          toReceived,
          fromRemainingToday: maxAmount - fromSentToday,
        };
      }

      const [{ sent: newFromSent }, { received: newToReceived }] =
        await Promise.all([
          store.incTotal(from, {
            sent: +amount,
          }),
          store.incTotal(to, {
            received: +amount,
          }),
        ]);

      return {
        success: true,
        fromSent: newFromSent,
        toReceived: newToReceived,
        fromRemainingToday: maxAmount - newFromToday.sent,
      };
    },
    async getTotalRanking() {
      const topReceived = await store.getTotalRank(10, "received");
      const topSent = await store.getTotalRank(10, "sent");

      return { topReceived, topSent };
    },
  };
}
