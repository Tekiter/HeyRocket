import { AmountStore } from "./store/types";

interface AmountManagerOptions {
  store: AmountStore;
  maxAmount: number;
}

export function createAmountManager({
  store,
  maxAmount,
}: AmountManagerOptions) {
  return {
    async getTotalAmount(userId: string) {
      return await store.getTotal(userId);
    },
    async give(from: string, to: string, amount: number) {
      const fromAmount = await store.getTotal(from);
      const toAmount = await store.getTotal(to);
      const fromTodayRemaining = maxAmount - (await store.getTodayUsed(from));

      const newToAmount = toAmount + amount;
      const newTodayRemaining = fromTodayRemaining - amount;
      console.log(fromTodayRemaining, newTodayRemaining);
      if (newTodayRemaining < 0) {
        return {
          success: false,
          fromAmount,
          toAmount,
          fromTodayRemaining,
        };
      }

      await store.setTotal(to, newToAmount);
      await store.setTodayUsed(from, maxAmount - newTodayRemaining);

      return {
        success: true,
        fromAmount,
        toAmount: newToAmount,
        fromTodayRemaining: newTodayRemaining,
      };
    },
  };
}
