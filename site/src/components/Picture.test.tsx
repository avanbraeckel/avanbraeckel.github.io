import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Picture } from "@/components/Picture";
import { getMedia, getMediaByGroup } from "@/media";
import manifest from "@/media/manifest.json";

function sources(container: HTMLElement) {
  return Array.from(container.querySelectorAll("picture > source"));
}

describe("Picture", () => {
  it("renders AVIF then WebP sources with width descriptors", () => {
    const { container } = render(<Picture id="magnet-waterloo-exterior" />);
    const [avif, webp] = sources(container);
    expect(avif).toHaveAttribute("type", "image/avif");
    expect(webp).toHaveAttribute("type", "image/webp");
    expect(avif.getAttribute("srcset")).toMatch(
      /^\/media\/magnet-waterloo-exterior-640\.\w+\.avif 640w, .+ 1280w, .+ 1920w$/,
    );
    expect(webp.getAttribute("srcset")).toMatch(/\.webp 640w, .+\.webp 1280w$/);
  });

  it("uses manifest alt text by default and allows an override", () => {
    const { rerender } = render(<Picture id="portrait" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "alt",
      getMedia("portrait").alt,
    );
    rerender(<Picture id="portrait" alt="" />);
    expect(screen.getByRole("presentation")).toHaveAttribute("alt", "");
  });

  it("is lazy by default", () => {
    render(<Picture id="portrait" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).not.toHaveAttribute("fetchpriority");
  });

  it("loads eagerly with high fetch priority when priority is set", () => {
    render(<Picture id="portrait" priority />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  it("passes sizes to every source and defaults to 100vw", () => {
    const { container, rerender } = render(
      <Picture id="transient-screenshot" />,
    );
    for (const source of sources(container))
      expect(source).toHaveAttribute("sizes", "100vw");
    rerender(
      <Picture
        id="transient-screenshot"
        sizes="(min-width: 768px) 50vw, 100vw"
      />,
    );
    for (const source of sources(container)) {
      expect(source).toHaveAttribute("sizes", "(min-width: 768px) 50vw, 100vw");
    }
  });

  it("sets explicit dimensions and a WebP fallback src", () => {
    render(<Picture id="transient-screenshot" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "1280");
    expect(img).toHaveAttribute("height", "640");
    expect(img.getAttribute("src")).toMatch(
      /^\/media\/transient-screenshot-1280\.\w+\.webp$/,
    );
  });

  it("shows a blur placeholder for photos but not for transparent logos", () => {
    const { rerender } = render(<Picture id="magnet-ottawa-tulips" />);
    expect(screen.getByRole("img").style.backgroundImage).toContain(
      "data:image/webp;base64,",
    );
    rerender(<Picture id="logo-ncr" />);
    expect(screen.getByRole("img").style.backgroundImage).toBe("");
  });
});

describe("media manifest", () => {
  const images = Object.values(manifest.images);

  it("never upscales and keeps every image under 1920px wide", () => {
    for (const image of images) {
      for (const source of image.sources) {
        for (const { width } of source.srcSet)
          expect(width).toBeLessThanOrEqual(image.width);
      }
      expect(image.width).toBeLessThanOrEqual(1920);
    }
    // The 1280px portrait stops at its intrinsic width: no 1920px variant.
    expect(
      getMedia("portrait").sources[0].srcSet.map(({ width }) => width),
    ).toEqual([640, 1280]);
  });

  it("respects EXIF orientation (rotated tulips photo is portrait)", () => {
    const tulips = getMedia("magnet-ottawa-tulips");
    expect(tulips.height).toBeGreaterThan(tulips.width);
  });

  it("has alt text and a caption for every image", () => {
    for (const image of images) {
      expect(image.alt.length).toBeGreaterThan(0);
      expect(image.caption.length).toBeGreaterThan(0);
    }
  });

  it("curates 4-8 photos per Magnet term and only the logo for NCR", () => {
    for (const group of ["magnet-review", "magnet-axiom-cyber"] as const) {
      const photos = getMediaByGroup(group, "photo");
      expect(photos.length).toBeGreaterThanOrEqual(4);
      expect(photos.length).toBeLessThanOrEqual(8);
    }
    expect(getMediaByGroup("ncr").map((image) => image.id)).toEqual([
      "logo-ncr",
    ]);
  });
});
