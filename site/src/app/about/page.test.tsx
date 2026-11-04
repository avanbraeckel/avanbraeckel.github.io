import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";
import { site } from "@/content/site";

describe("About page", () => {
  it("renders its h1", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "About" }),
    ).toBeInTheDocument();
  });

  it("opens with the current role", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        /Software Engineer on the Nexus team at Magnet Forensics/,
      ),
    ).toBeInTheDocument();
  });

  it("links to the résumé, GitHub, and LinkedIn", () => {
    render(<AboutPage />);
    const resume = screen.queryByRole("link", { name: /résumé/i });
    if (site.resume) expect(resume).toHaveAttribute("href", site.resume.href);
    else expect(resume).toBeNull();
    for (const social of site.social) {
      expect(
        screen.getByRole("link", { name: new RegExp(social.label, "i") }),
      ).toHaveAttribute("href", social.href);
    }
  });

  it("lists the interests from the original bio", () => {
    render(<AboutPage />);
    for (const name of [
      "Problem-solving",
      "Mentoring",
      "Graphic design",
      "Video games",
      "Music",
      "Manga and comics",
      "Watches",
      "Film",
      "Mathematics",
    ]) {
      expect(
        screen.getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    }
  });

  it("shows the shelf and watch photos with captions", () => {
    render(<AboutPage />);
    expect(
      screen.getByRole("img", { name: /bookshelves/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /watch box/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        "My shelves, which double as my background on work calls",
      ),
    ).toBeInTheDocument();
  });

  it("features the song with a click-to-load video", () => {
    const { container } = render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 2, name: "I made a song!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /play “cat in the studio”/i }),
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("does not use the old student framing", () => {
    const { container } = render(<AboutPage />);
    expect(container.textContent).not.toMatch(/fifth-year|uoguelph\.ca/i);
  });
});
