import { AmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import {
  canNotSendMoreMessage,
  receivedMessage,
  sentSuccessMessage,
} from "./view/messages";
import { createHomeView } from "./view/home";
import { SlackAPIClient } from "slack-cloudflare-workers";

export class App {
  constructor(
    private amountManager: AmountManager,
    private client: SlackAPIClient,
    private emoji: string
  ) {}

  async updateHomeTab(userId: string) {
    const tabBlocks = await createHomeView(
      userId,
      this.emoji,
      this.amountManager
    );

    await this.client.views.publish({
      user_id: userId,
      view: {
        type: "home",
        blocks: tabBlocks,
      },
    });
  }

  async inviteBotToChannel(channelId: string, user: string) {
    if (!channelId) {
      return;
    }

    await this.client.conversations.join({
      channel: channelId,
    });
    await this.client.chat.postMessage({
      text: `<#${channelId}> 채널에서 이제 :rocket:을 사용할 수 있어요!`,
      channel: user,
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

    const targets = mentions.filter((mention) => mention !== user);

    for (const target of targets) {
      const { success, fromRemainingToday, toReceived } =
        await this.amountManager.give(user, target, count);

      if (!success) {
        await this.client.chat.postEphemeral({
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
        return;
      }

      await Promise.all([
        this.client.chat.postEphemeral({
          text: sentSuccessMessage(
            target,
            this.emoji,
            count,
            fromRemainingToday
          ),
          user,
          channel,
          thread_ts,
        }),
        this.client.chat.postMessage({
          text: receivedMessage(user, this.emoji, count, toReceived),
          channel: target,
        }),
      ]);
    }
  }
}
