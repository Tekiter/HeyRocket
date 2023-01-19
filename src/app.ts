import { AmountManager } from "./amountManager";
import { extractTarget } from "./extractTarget";
import { SlackWebClient } from "./slack/webapi";
import {
  canNotSendMoreMessage,
  receivedMessage,
  sentSuccessMessage,
} from "./view/messages";
import { uniq } from "./util";
import { createHomeView } from "./view/home";

export class App {
  constructor(
    private amountManager: AmountManager,
    private client: SlackWebClient,
    private emoji: string
  ) {}

  async updateHomeTab(userId: string) {
    const tabBlocks = await createHomeView(
      userId,
      this.emoji,
      this.amountManager
    );

    await this.client.request("views.publish", {
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

    await this.client.request("conversations.join", {
      channel: channelId,
    });
    await this.client.request("chat.postMessage", {
      text: `<#{channelId}> 채널에서 이제 :rocket:을 사용할 수 있어요!`,
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
