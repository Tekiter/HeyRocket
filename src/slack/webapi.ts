import { WebAPITypes } from "./types";

interface SlackWebClientOptions {
  botToken: string;
}

export function createSlackWebClient({ botToken }: SlackWebClientOptions) {
  return {
    async request<K extends keyof WebAPITypes>(
      key: K,
      payload: Parameters<WebAPITypes[K]>[0]
    ): Promise<ReturnType<WebAPITypes[K]>> {
      console.log("REQUESTING", key, payload, botToken);
      const res = await fetch(`https://slack.com/api/${key}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${botToken}`,
        },
        body: JSON.stringify(payload),
      });

      return (await res.json()) as never;
    },
  };
}
