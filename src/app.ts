import { createAmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import { createSlackWebClient } from "./slack/webapi";
import {
  canNotSendMoreMessage,
  rankRecordMessage,
  receivedMessage,
  sentSuccessMessage,
} from "./messages";
import { uniq } from "./util";

export class App {
  constructor(
    private amountManager: ReturnType<typeof createAmountManager>,
    private client: ReturnType<typeof createSlackWebClient>,
    private emoji: string
  ) {}

  async updateHomeTab(user: string) {
    const { topReceived, topSent } = await this.amountManager.getTotalRanking();

    await this.client.request("views.publish", {
      user_id: user,
      view: {
        type: "home",
        blocks: [
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
                  .join("\n")}`,
              },
              {
                type: "mrkdwn",
                text: `*보낸 개수*\n${topSent
                  .map(({ user, sent }, idx) =>
                    rankRecordMessage(idx + 1, user, sent, this.emoji)
                  )
                  .join("\n")}`,
              },
            ],
          },
          {
            type: "divider",
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
