export interface AmountStore {
  getTotal(userId: string): Promise<Amount>;
  setTotal(userId: string, amount: Partial<Amount>): Promise<void>;
  incTotal(userId: string, delta: Partial<Amount>): Promise<Amount>;

  getToday(userId: string): Promise<Amount>;
  setToday(userId: string, amount: Partial<Amount>): Promise<void>;
  incToday(
    userId: string,
    delta: Partial<Amount>,
    max?: Partial<Amount>
  ): Promise<Amount | null>;

  getTotalRank(limit: number, type: "sent" | "received"): Promise<RankRecord[]>;
  commit(): Promise<void>;
}

interface Amount {
  sent: number;
  received: number;
}

interface RankRecord {
  user: string;
  sent: number;
  received: number;
}
