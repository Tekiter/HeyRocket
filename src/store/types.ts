export interface AmountStore {
  getTotal(userId: string): Promise<number>;
  setTotal(userId: string, amount: number): Promise<void>;
  getTodayUsed(userId: string): Promise<number>;
  setTodayUsed(userId: string, amount: number): Promise<void>;
  commit(): Promise<void>;
}
