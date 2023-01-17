import { KnownEventFromType, SlackEvent } from "@slack/bolt/dist/types/events";
import { EnvelopedEvent, EventBase, HandshakeEvent } from "./types";

export function createSlackEventHandler() {
  const fnMap = new Map<string, (data: SlackEvent) => Promise<void> | void>();

  const handler = {
    onEvent<K extends SlackEvent["type"]>(
      type: K,
      fn: (payload: KnownEventFromType<K>) => Promise<void> | void
    ) {
      fnMap.set(type, fn as never);
    },
    async handle(data: unknown) {
      if (!isEventPayload(data)) {
        throw new Error();
      }

      if (isChallengeEvent(data)) {
        return {
          challenge: data.challenge,
        };
      }

      if (isEventCallback(data)) {
        const handler = fnMap.get(data.event.type);
        if (handler) {
          await handler(data.event as never);
        }
      }

      return {};
    },
  };

  return handler;
}

function isEventPayload(data: unknown): data is EventBase {
  if (!data || typeof data !== "object") {
    return false;
  }

  return typeof (data as EventBase).type === "string";
}

function isChallengeEvent(data: EventBase): data is HandshakeEvent {
  return data.type === "url_verification";
}

function isEventCallback(data: EventBase): data is EnvelopedEvent {
  return data.type === "event_callback";
}
