export type {
  MessageEvent,
  EnvelopedEvent,
} from "@slack/bolt/dist/types/events";
import type { Methods } from "@slack/web-api/dist/methods";

export interface WebAPITypes {
  "chat.postMessage": Methods["chat"]["postMessage"];
}

export interface EventBase {
  type: string;
}

export interface HandshakeEvent extends EventBase {
  challenge: string;
}
