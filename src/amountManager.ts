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
      const fromTodayUsed = await store.getTodayUsed(from);

      const newToAmount = toAmount + amount;
      const newFromTodayUsed = fromTodayUsed + amount;

      if (newFromTodayUsed > maxAmount) {
        return {
          success: false,
          fromAmount,
          toAmount,
          fromTodayRemaining: maxAmount - fromTodayUsed,
        };
      }

      await store.setTotal(to, newToAmount);
      await store.setTodayUsed(from, newFromTodayUsed);

      return {
        success: true,
        fromAmount,
        toAmount: newToAmount,
        fromTodayRemaining: maxAmount - newFromTodayUsed,
      };
    },
  };
}
