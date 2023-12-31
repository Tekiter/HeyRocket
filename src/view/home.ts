import { AmountManager } from "../amountManager";
import { dateToInt } from "../util";
import { createRankingMessage } from "./ranking";
import {
  AnyHomeTabBlock,
  AnySendableMessageBlock,
} from "slack-cloudflare-workers";

export async function createHomeView(
  userId: string,
  emoji: string,
  amountManager: AmountManager
): Promise<AnyHomeTabBlock[]> {
  const [
    { topReceived, topSent },
    { topReceived: topReceivedToday, topSent: topSentToday },
    { sent, received },
    remaining,
  ] = await Promise.all([
    amountManager.getTotalRanking(),
    amountManager.getTodayRanking(),
    amountManager.getTotal(userId),
    amountManager.getTodayRemaining(userId),
  ]);

  return [
    margin,
    ...intro(emoji, amountManager.maxAmount),
    margin,
    ...addHeyWorkerToChannel(emoji),
    margin,
    divider,
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "현재 시즌 랭킹",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*받은 개수*\n${createRankingMessage(
            topReceived.map((item) => ({
              user: item.user,
              amount: item.received,
            })),
            emoji
          )}\n`,
        },
        {
          type: "mrkdwn",
          text: `*보낸 개수*\n${createRankingMessage(
            topSent.map((item) => ({
              user: item.user,
              amount: item.sent,
            })),
            emoji
          )}\n`,
        },
      ],
    },
    margin,
    divider,
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "오늘의 랭킹",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*받은 개수*\n${createRankingMessage(
            topReceivedToday.map((item) => ({
              user: item.user,
              amount: item.received,
            })),
            emoji
          )}\n`,
        },
        {
          type: "mrkdwn",
          text: `*보낸 개수*\n${createRankingMessage(
            topSentToday.map((item) => ({
              user: item.user,
              amount: item.sent,
            })),
            emoji
          )}\n`,
        },
      ],
    },
    margin,
    divider,
    ...personalRecord(userId, emoji, sent, received, remaining),
    margin,
    divider,
    ...footer(),
  ];
}

const margin = {
  type: "context",
  elements: [
    {
      type: "image",
      image_url:
        "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
      alt_text: "placeholder",
    },
  ],
} satisfies AnySendableMessageBlock;

const divider = {
  type: "divider",
} satisfies AnySendableMessageBlock;

function intro(emoji: string, maxAmount: number) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `감사한 일이 있을 때, ${emoji}을 보내 마음을 전하세요!`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `감사한 마음을 전하려면 메시지에 멘션과 함께 \`${emoji}\`을 포함시켜 메시지를 보내세요. ${emoji}는 하루에 ${maxAmount}개까지 보낼 수 있어요.\n`,
      },
    },
  ] satisfies AnySendableMessageBlock[];
}

function addHeyWorkerToChannel(emoji: string) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${emoji}을 보내려면 채널에 봇이 추가되어 있어야 해요! 채널을 선택하면 대신 추가해 드릴게요.`,
      },
      accessory: {
        type: "conversations_select",
        placeholder: {
          type: "plain_text",
          text: "Select a channel...",
          emoji: true,
        },
        action_id: "add_bot_to_channel",
      },
    },
  ] satisfies AnySendableMessageBlock[];
}

function personalRecord(
  userId: string,
  emoji: string,
  sent: number,
  received: number,
  remaining: number
) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*<@${userId}>의 정보*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `지금까지 ${emoji}를 ${sent}개 보내고, ${received}개 받았어요.`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `오늘은 ${emoji}x${remaining}개 더 보낼 수 있어요.`,
        },
      ],
    },
  ] satisfies AnySendableMessageBlock[];
}

function footer() {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_마지막 업데이트: <!date^${dateToInt(
          new Date()
        )}^{date_num} {time}|${new Date().toISOString()}>_`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "새로고침",
          emoji: true,
        },
        action_id: "refresh_home_tab",
      },
    },
  ] satisfies AnySendableMessageBlock[];
}
