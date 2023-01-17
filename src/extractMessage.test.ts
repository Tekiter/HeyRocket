import { describe, expect, it } from "vitest";
import { getNiddleCount, getMentions } from "./extractMessage";

describe("extractMessage", () => {
  it("should getCount", async () => {
    expect(getNiddleCount("aaaa", "a")).toBe(4);
    expect(getNiddleCount("aaaa", "aa")).toBe(2);
    expect(getNiddleCount("aaaaa", "aaa")).toBe(1);
    expect(getNiddleCount("aaaa", "aaaa")).toBe(1);
    expect(getNiddleCount("aabaa", "aa")).toBe(2);
    expect(getNiddleCount("baabaab", "aa")).toBe(2);
  });

  it("should extract mentions", () => {
    expect(getMentions("hello, <@HELLOWORLD123>")).toEqual(["HELLOWORLD123"]);
    expect(getMentions("hello, <@HELLOWORLD123> <@AA33> ")).toEqual([
      "HELLOWORLD123",
      "AA33",
    ]);
    expect(getMentions("hello,")).toEqual([]);
  });
});
