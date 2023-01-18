export function canNotSendMoreMessage(
  mentions: string[],
  emoji: string,
  count: number,
  remaning: number
) {
  return `${mentions
    .map((user) => `<@${user}>`)
    .join(
      ", "
    )} 에게 ${emoji} ${count}개를 더 보낼 수 없어요! 오늘은 ${remaning}개만 더 보낼 수 있어요.`;
}

export function sentSuccessMessage(
  user: string,
  emoji: string,
  count: number,
  remaning: number
) {
  return `${user} 에게 ${emoji}을 ${count}개 보냈어요! 오늘 ${remaning}개를 더 보낼 수 있어요.`;
}

export function receivedMessage(
  user: string,
  emoji: string,
  count: number,
  total: number
) {
  return `<@${user}> 에게서 ${emoji} ${count}개를 받았어요! 지금까지 받은 ${emoji}는 총 ${total}개에요.`;
}
