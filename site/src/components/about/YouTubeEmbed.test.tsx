import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { YouTubeEmbed } from "./YouTubeEmbed";

describe("YouTubeEmbed", () => {
  it("shows only the thumbnail and a play button until pressed", () => {
    const { container } = render(
      <YouTubeEmbed id="MEmqIJStfXQ" title="Cat In The Studio" />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://i.ytimg.com/vi/MEmqIJStfXQ/hqdefault.jpg",
    );
    expect(
      screen.getByRole("button", { name: "Play “Cat In The Studio”" }),
    ).toBeInTheDocument();
  });

  it("loads the privacy-enhanced player on click and focuses it", async () => {
    const user = userEvent.setup();
    render(<YouTubeEmbed id="MEmqIJStfXQ" title="Cat In The Studio" />);
    await user.click(screen.getByRole("button"));
    const frame = screen.getByTitle("Cat In The Studio");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/MEmqIJStfXQ?autoplay=1&rel=0",
    );
    expect(frame).toHaveFocus();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <YouTubeEmbed id="MEmqIJStfXQ" title="Cat In The Studio" />,
    );
    expect(await axe(container)).toHaveProperty("violations", []);
  });
});
