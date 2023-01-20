interface RankingItem {
  user: string;
  amount: number;
}

export function createRankingMessage(ranking: RankingItem[], emoji: string) {
  return ranking
    .map(({ user, amount: value }, idx) =>
      rankingLine(idx + 1, user, value, emoji)
    )
    .join("\n");
}

export function rankingLine(
  rank: number,
  user: string,
  value: number,
  emoji: string
) {
  return `*${rank}위:*  ${emoji} x ${value}\t<@${user}>`;
}
