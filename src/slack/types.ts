export type {
  MessageEvent,
  EnvelopedEvent,
  KnownEventFromType,
  SlackEvent,
} from "@slack/bolt/dist/types/events";

import type { Methods } from "@slack/web-api/dist/methods";

export interface WebAPITypes {
  "chat.postMessage": Methods["chat"]["postMessage"];
  "chat.postEphemeral": Methods["chat"]["postEphemeral"];
}

export interface EventBase {
  type: string;
}

export interface HandshakeEvent extends EventBase {
  challenge: string;
}
