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
