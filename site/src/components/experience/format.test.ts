import { describe, expect, it } from "vitest";
import {
  formatMonth,
  formatRange,
  formatSpan,
  isoMonth,
  monthSpan,
  parseMonth,
} from "./format";

describe("parseMonth", () => {
  it("parses YYYY-MM", () => {
    expect(parseMonth("2021-05")).toEqual({ year: 2021, month: 5 });
  });

  it.each(["", "2021", "2021-13", "2021-00", "21-05", "2021-5"])(
    "rejects %j",
    (value) => {
      expect(parseMonth(value)).toBeNull();
    },
  );
});

describe("formatRange", () => {
  it("spans years in full", () => {
    expect(formatRange("2021-05", "2021-12")).toBe("May – Dec 2021");
    expect(formatRange("2022-11", "2023-02")).toBe("Nov 2022 – Feb 2023");
  });

  it("handles single months, ongoing, and unknown starts", () => {
    expect(formatMonth("2023-01")).toBe("Jan 2023");
    expect(formatRange("2023-01", "2023-01")).toBe("Jan 2023");
    expect(formatRange("2024-01", null)).toBe("Jan 2024 – Present");
    expect(formatRange("", null)).toBeNull();
    expect(formatRange(null, null)).toBeNull();
  });

  it("reads 'Now' for a current role without a published start", () => {
    expect(formatRange(null, null, true)).toBe("Now");
    expect(formatRange("2024-01", null, true)).toBe("Jan 2024 – Present");
  });
});

describe("spans", () => {
  it("counts months inclusively", () => {
    expect(monthSpan("2022-05", "2022-08")).toBe(4);
    expect(monthSpan("2021-05", "2021-12")).toBe(8);
    expect(monthSpan("2021-05", null)).toBeNull();
  });

  it("formats months and years", () => {
    expect(formatSpan("2023-01", "2023-08")).toBe("8 months");
    expect(formatSpan("2023-01", "2023-01")).toBe("1 month");
    expect(formatSpan("2022-01", "2023-02")).toBe("1 year 2 months");
    expect(formatSpan("", null)).toBeNull();
    expect(formatSpan(null, null)).toBeNull();
  });

  it("only emits valid dateTime values", () => {
    expect(isoMonth("2021-05")).toBe("2021-05");
    expect(isoMonth("")).toBeUndefined();
    expect(isoMonth(null)).toBeUndefined();
  });
});
