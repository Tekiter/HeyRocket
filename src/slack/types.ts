export type {
  KnownBlock,
  MessageEvent,
  EnvelopedEvent,
  KnownEventFromType,
  SlackEvent,
  BlockAction,
  BlockElementAction,
} from "@slack/bolt";

import type { Methods } from "@slack/web-api/dist/methods";

export interface WebAPITypes {
  "chat.postMessage": Methods["chat"]["postMessage"];
  "chat.postEphemeral": Methods["chat"]["postEphemeral"];
  "views.publish": Methods["views"]["publish"];
  "conversations.join": Methods["conversations"]["join"];
}

export interface EventBase {
  type: string;
}

export interface HandshakeEvent extends EventBase {
  challenge: string;
}
