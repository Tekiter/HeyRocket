import { BlockAction, BlockElementAction } from "./types";

export function createSlackActionHandler() {
  const blockActionHandlerMap = new Map<string, Callback<BlockElementAction>>();

  return {
    onBlockAction<K extends BlockElementAction["type"]>(
      type: K,
      fn: Callback<BlockElementAction & { type: K }>
    ) {
      blockActionHandlerMap.set(type, fn as never);
    },
    async handle(data: unknown) {
      if (isBlockAction(data)) {
        await Promise.allSettled(
          data.actions.map(async (action) => {
            const handler = blockActionHandlerMap.get(action.type);
            if (handler) {
              return handler(action, data);
            }
          })
        );
        return;
      }

      console.error("Unknown Slack Action", data);
      throw new Error("Unknown Slack Action");
    },
  };
}

type Callback<T> = (action: T, payload: BlockAction) => Promise<void> | void;

function isBlockAction(data: unknown): data is BlockAction {
  if (!data || typeof data !== "object") {
    return false;
  }

  return (data as BlockAction).type === "block_actions";
}
