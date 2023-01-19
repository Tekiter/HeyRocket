export function canNotSendMoreMessage(
  target: string,
  emoji: string,
  count: number,
  remaining: number
) {
  const moreMessage = (() => {
    if (remaining === 0) {
      return `오늘은 더 이상 보낼 수 있는 ${emoji}가 없어요.`;
    }
    return `오늘은 ${emoji} ${remaining}개만 더 보낼 수 있어요.`;
  })();

  return `<@${target}> 에게 ${emoji} ${count}개를 보내지 못했어요! ${moreMessage}`;
}

export function sentSuccessMessage(
  user: string,
  emoji: string,
  count: number,
  remaining: number
) {
  const moreMessage = (() => {
    if (remaining === 0) {
      return `오늘은 더 이상 보낼 수 있는 ${emoji}가 없어요.`;
    }
    return `오늘은 ${emoji} ${remaining}개를 더 보낼 수 있어요.`;
  })();

  return `<@${user}> 에게 ${emoji}을 ${count}개 보냈어요! ${moreMessage}`;
}

export function receivedMessage(
  user: string,
  emoji: string,
  count: number,
  received: number
) {
  return `<@${user}> 에게서 ${emoji} ${count}개를 받았어요! 지금까지 받은 ${emoji}는 총 ${received}개에요.`;
}

export function rankRecordMessage(
  rank: number,
  user: string,
  value: number,
  emoji: string
) {
  return `*${rank}위:*  ${emoji} x ${value}\t<@${user}>`;
}
