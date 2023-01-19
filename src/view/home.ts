import { AmountManager } from "../amountManager";
import { rankRecordMessage } from "./messages";
import { dateToInt } from "../util";

export async function createHomeView(
  userId: string,
  emoji: string,
  amountManager: AmountManager
) {
  const [{ topReceived, topSent }, { sent, received }, remaining] =
    await Promise.all([
      amountManager.getTotalRanking(),
      amountManager.getTotal(userId),
      amountManager.getTodayRemaining(userId),
    ]);

  return [
    blockPlaceholder,
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
        text: `감사한 마음을 전하려면 메시지에 멘션과 함께 \`${emoji}\`을 포함시켜 메시지를 보내세요. ${emoji}는 하루에 ${amountManager.maxAmount}개까지 보낼 수 있어요.\n`,
      },
    },
    blockPlaceholder,
    {
      type: "divider",
    },
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "전체 기간 랭킹",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*받은 개수*\n${topReceived
            .map(({ user, received }, idx) =>
              rankRecordMessage(idx + 1, user, received, emoji)
            )
            .join("\n")}\n`,
        },
        {
          type: "mrkdwn",
          text: `*보낸 개수*\n${topSent
            .map(({ user, sent }, idx) =>
              rankRecordMessage(idx + 1, user, sent, emoji)
            )
            .join("\n")}\n`,
        },
      ],
    },
    blockPlaceholder,
    {
      type: "divider",
    },
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
    blockPlaceholder,
    {
      type: "divider",
    },
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
  ];
}

const blockPlaceholder = {
  type: "context",
  elements: [
    {
      type: "image",
      image_url:
        "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
      alt_text: "placeholder",
    },
  ],
};
