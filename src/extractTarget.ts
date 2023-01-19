import { uniq } from "./util";

type ExtractedTarget =
  | { success: true; count: number; mentions: string[] }
  | { success: false; count?: undefined; mentions?: undefined };

export function extractTarget(
  message: string,
  niddle: string
): ExtractedTarget {
  const count = getNiddleCount(message, niddle);
  if (count == 0) {
    return { success: false };
  }

  const mentions = getMentions(message);
  if (mentions.length === 0) {
    return { success: false };
  }

  return {
    success: true,
    count,
    mentions,
  };
}

export function getNiddleCount(message: string, niddle: string) {
  let result = 0;

  let start = 0;
  while (start < message.length - niddle.length + 1) {
    let isFound = true;

    for (let matched = 0; matched < niddle.length; matched++) {
      if (message[start + matched] !== niddle[matched]) {
        isFound = false;
        break;
      }
    }

    if (isFound) {
      result += 1;
      start += niddle.length;
    } else {
      start += 1;
    }
  }

  return result;
}

export function getMentions(message: string) {
  const regexp = /<@([A-Z0-9]+?)>/g;

  const matches = [...message.matchAll(regexp)];

  return uniq(matches.map((match) => match[1]));
}
