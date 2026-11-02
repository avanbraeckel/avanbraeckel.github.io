/**
 * Pixel-art strips from Transient (the owner's 2019 game), extracted by
 * scripts/extract-sprites.mjs. Each PNG is one horizontal strip of equal-sized
 * frames at the original pixel size; sprites.json holds the frame geometry.
 */
import gem from "./gem.png";
import playerIdle from "./player-idle.png";
import playerJump from "./player-jump.png";
import playerRun from "./player-run.png";
import portal from "./portal.png";
import slime from "./slime.png";
import spider from "./spider.png";
import geometry from "./sprites.json";

export interface SpriteSheet {
  /** URL of the strip. */
  src: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  /** Playback rate the animation was drawn for. */
  fps: number;
  /** Frame shown when motion is reduced. */
  still: number;
  /** Which way the artwork faces. */
  facing: "left" | "right";
}

/** Next resolves image imports to StaticImageData; Vite (tests) to a URL. */
function url(asset: string | { src: string }): string {
  return typeof asset === "string" ? asset : asset.src;
}

type Name = keyof typeof geometry;

function sheet(
  name: Name,
  asset: string | { src: string },
  rest: Pick<SpriteSheet, "fps" | "still" | "facing">,
): SpriteSheet {
  return { src: url(asset), ...geometry[name], ...rest };
}

export const sprites = {
  "player-idle": sheet("player-idle", playerIdle, {
    fps: 6,
    still: 0,
    facing: "right",
  }),
  "player-run": sheet("player-run", playerRun, {
    fps: 10,
    still: 0,
    facing: "right",
  }),
  "player-jump": sheet("player-jump", playerJump, {
    fps: 10,
    still: 3,
    facing: "right",
  }),
  slime: sheet("slime", slime, { fps: 8, still: 0, facing: "left" }),
  spider: sheet("spider", spider, { fps: 6, still: 0, facing: "right" }),
  gem: sheet("gem", gem, { fps: 10, still: 0, facing: "right" }),
  portal: sheet("portal", portal, { fps: 8, still: 0, facing: "right" }),
} satisfies Record<Name, SpriteSheet>;

export type SpriteName = keyof typeof sprites;
