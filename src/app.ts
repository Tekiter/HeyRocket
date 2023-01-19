import { createAmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import { createSlackWebClient } from "./slack/webapi";
import {
  canNotSendMoreMessage,
  rankRecordMessage,
  receivedMessage,
  sentSuccessMessage,
} from "./messages";
import { dateToInt, uniq } from "./util";

export class App {
  constructor(
    private amountManager: ReturnType<typeof createAmountManager>,
    private client: ReturnType<typeof createSlackWebClient>,
    private emoji: string
  ) {}

  async updateHomeTab(userId: string) {
    const [{ topReceived, topSent }, { sent, received }, remaining] =
      await Promise.all([
        this.amountManager.getTotalRanking(),
        this.amountManager.getTotal(userId),
        this.amountManager.getTodayRemaining(userId),
      ]);

    await this.client.request("views.publish", {
      user_id: userId,
      view: {
        type: "home",
        blocks: [
          blockPlaceholder,
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `감사한 일이 있을 때, ${this.emoji}을 보내 마음을 전하세요!`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `감사한 마음을 전하려면 메시지에 멘션과 함께 \`${this.emoji}\`을 포함시켜 메시지를 보내세요. ${this.emoji}는 하루에 ${this.amountManager.maxAmount}개까지 보낼 수 있어요.\n`,
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
                    rankRecordMessage(idx + 1, user, received, this.emoji)
                  )
                  .join("\n")}\n`,
              },
              {
                type: "mrkdwn",
                text: `*보낸 개수*\n${topSent
                  .map(({ user, sent }, idx) =>
                    rankRecordMessage(idx + 1, user, sent, this.emoji)
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
              text: `지금까지 ${this.emoji}를 ${sent}개 보내고, ${received}개 받았어요.`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `오늘은 ${this.emoji}x${remaining}개 더 보낼 수 있어요.`,
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
        ],
      },
    });
  }

  async handleUserChat(
    user: string,
    text: string,
    channel: string,
    thread_ts?: string
  ) {
    const { success, mentions, count } = extractTarget(text, this.emoji);
    if (!success) {
      return;
    }

    const targets = uniq(mentions);
    for (const target of targets) {
      if (user === target) {
        continue;
      }

      const { success, fromRemainingToday, toReceived } =
        await this.amountManager.give(user, target, count);

      if (!success) {
        await this.client.request("chat.postEphemeral", {
          text: canNotSendMoreMessage(
            target,
            this.emoji,
            count,
            fromRemainingToday
          ),
          user,
          channel,
          thread_ts,
        });
        continue;
      }

      await this.client.request("chat.postEphemeral", {
        text: sentSuccessMessage(target, this.emoji, count, fromRemainingToday),
        user,
        channel,
        thread_ts,
      });

      await this.client.request("chat.postMessage", {
        text: receivedMessage(user, this.emoji, count, toReceived),
        channel: target,
      });
    }
  }
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
