import { WebAPITypes } from "./types";

interface SlackWebClientOptions {
  botToken: string;
}

export function createSlackWebClient({ botToken }: SlackWebClientOptions) {
  return {
    async request<K extends keyof WebAPITypes>(
      key: K,
      payload: Parameters<WebAPITypes[K]>[0]
    ): Promise<Awaited<ReturnType<WebAPITypes[K]>>> {
      const res = await fetch(`https://slack.com/api/${key}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${botToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!(data as { ok: boolean })?.ok) {
        console.error(data);
      }
      return data as never;
    },
  };
}
