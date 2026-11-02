import { describe, expect, it } from "vitest";
import { ariaCurrent, linkState } from "./navigation";

describe("linkState", () => {
  it("matches the current page with or without a trailing slash", () => {
    expect(linkState("/projects/", "/projects/")).toBe("page");
    expect(linkState("/projects", "/projects/")).toBe("page");
    expect(linkState("/projects/?a=1", "/projects/")).toBe("page");
  });

  it("marks ancestors of the current page as the current section", () => {
    expect(linkState("/experience/ncr/", "/experience/")).toBe("section");
    expect(linkState("/experience/ncr", "/experience/")).toBe("section");
  });

  it("does not match siblings, prefixes, or the root for every page", () => {
    expect(linkState("/projectsx/", "/projects/")).toBeNull();
    expect(linkState("/about/", "/projects/")).toBeNull();
    expect(linkState("/about/", "/")).toBeNull();
    expect(linkState(null, "/projects/")).toBeNull();
  });
});

describe("ariaCurrent", () => {
  it("maps link state to aria-current", () => {
    expect(ariaCurrent("/about/", "/about/")).toBe("page");
    expect(ariaCurrent("/experience/ncr/", "/experience/")).toBe("true");
    expect(ariaCurrent("/", "/about/")).toBeUndefined();
  });
});
