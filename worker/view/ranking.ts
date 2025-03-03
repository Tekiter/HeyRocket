interface RankingItem {
  user: string;
  amount: number;
}

export function createRankingMessage(ranking: RankingItem[], emoji: string) {
  const rankSlotLength = getIntegerLength(ranking.length);
  const amountSlotLength = getIntegerLength(
    ranking.reduce((prev, item) => Math.max(prev, item.amount), 0)
  );

  return ranking
    .map(
      ({ user, amount: value }, idx) =>
        `*${padStart(idx + 1, rankSlotLength)}위:*  ${emoji} x ${padEnd(
          value,
          amountSlotLength
        )}\t<@${user}>`
    )
    .join("\n");
}

function getIntegerLength(num: number) {
  return Math.floor(Math.log10(num)) + 1;
}

function padStart(value: unknown, length: number) {
  return `${value}`.padStart(length, "\u2007");
}

function padEnd(value: unknown, length: number) {
  return `${value}`.padEnd(length, "\u2007");
}
