import type { Metadata } from "next";
import { Button, Container } from "@/components/ui";
import { TransientPlayer } from "@/components/projects/TransientPlayer";
import { TRANSIENT_DOWNLOAD_HREF } from "@/content/projects";
import styles from "../projects.module.css";
import local from "./transient.module.css";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Transient",
  description:
    "Transient is a keyboard-only 2D platformer made from scratch in Java. Play it right in your browser, or download it for Windows or macOS.",
  path: "/projects/transient/",
});

const controls: { action: string; keys: string[] }[] = [
  { action: "Move", keys: ["←", "→"] },
  { action: "Jump", keys: ["Space"] },
  { action: "Glide", keys: ["Ctrl"] },
  { action: "Flash step", keys: ["Shift"] },
  { action: "Sword: light, medium, heavy", keys: ["A", "S", "D"] },
  { action: "Quick shot (midair)", keys: ["Q"] },
  { action: "Strong shot", keys: ["W"] },
];

export default function TransientPage() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Transient</h1>
        <p className={styles.lead}>
          A 2D platformer I made from scratch in Java in 2019. Fair warning, it
          isn’t easy! You can play it right here in your browser, or download it
          to play on your computer.
        </p>
        <div className={styles.actions}>
          <Button
            href={TRANSIENT_DOWNLOAD_HREF}
            download
            icon="download"
            size="large"
          >
            Download
          </Button>
          <span className={styles.note}>
            For Windows and macOS · Needs Java 10 or later
          </span>
        </div>
      </header>

      <div className={styles.stage}>
        <TransientPlayer priority />
      </div>

      <div className={styles.details}>
        <section className={styles.block} aria-labelledby="how-it-plays">
          <h2 id="how-it-plays" className={styles.blockTitle}>
            How it plays
          </h2>
          <div className={styles.prose}>
            <p>
              You’ve got a bow, a sword, and a timer that’s always running. Your
              goal is to reach the portal before time runs out, and your score
              depends on how fast you were, how much damage you took, and how
              many gems and enemies you collected along the way.
            </p>
            <p>
              Most of the fun is in the moveset. <strong>Strong shots</strong>{" "}
              hit harder but take longer to draw, and{" "}
              <strong>quick shots</strong> only work in midair. Your sword has
              light, medium, and heavy attacks, and each one is slower and
              stronger than the last. The <strong>flash step</strong> is a dash
              that makes you invulnerable while it lasts, and if you time it
              right with a glide, you can reach places you otherwise couldn’t.
            </p>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="levels">
          <h2 id="levels" className={styles.blockTitle}>
            Four levels
          </h2>
          <div className={styles.prose}>
            <ul className={styles.list}>
              <li>
                <strong>Level 1, Cavern Chaos.</strong> Full of secret passages,
                with gems hidden behind them.
              </li>
              <li>
                <strong>Level 2.</strong> This one is mostly about fighting.
              </li>
              <li>
                <strong>Level 3.</strong> This is the hard one! You can only
                finish it by using the advanced movement tricks.
              </li>
              <li>
                <strong>Bonus.</strong> No enemies, just falling targets to
                shoot. Once you hit the last one, the exit portal appears.
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="controls">
          <h2 id="controls" className={styles.blockTitle}>
            Controls
          </h2>
          <div className={styles.prose}>
            <p>
              It’s keyboard-only. In the menus, use the arrow keys, Enter, and
              Backspace. In the browser player, press Tab to leave the game and
              get back to the rest of the page.
            </p>
            <dl className={local.controls}>
              {controls.map(({ action, keys }) => (
                <div key={action} className={local.control}>
                  <dt>{action}</dt>
                  <dd>
                    {keys.map((key) => (
                      <kbd key={key} className={local.key}>
                        {key}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="under-the-hood">
          <h2 id="under-the-hood" className={styles.blockTitle}>
            Under the hood
          </h2>
          <div className={styles.prose}>
            <p>
              Everything is written in plain Java using Swing and AWT. A small
              state manager switches between fifteen different screens, from the
              save select to the game-over screen. Each level is a tile map
              stored as a CSV file, with separate layers for what you see, what
              you collide with, and the secret areas. The music is MP3, decoded
              with the JavaZoom libraries, and four save slots each keep a high
              score for every level.
            </p>
            <p>
              The hero and slime sprites (the ones you’ll spot around this site,
              too) are based on rvros’s free{" "}
              <a
                href="https://rvros.itch.io/animated-pixel-hero"
                target="_blank"
                rel="noopener noreferrer"
              >
                Animated Pixel Adventurer
              </a>{" "}
              and{" "}
              <a
                href="https://rvros.itch.io/pixel-art-animated-slime"
                target="_blank"
                rel="noopener noreferrer"
              >
                Animated Pixel Slime
              </a>
              . Thanks, rvros!
            </p>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="running-it">
          <h2 id="running-it" className={styles.blockTitle}>
            Running it
          </h2>
          <div className={styles.prose}>
            <p>
              The player above runs the original game JAR right in your browser
              using{" "}
              <a
                href="https://cheerpj.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                CheerpJ
              </a>
              , which is a Java runtime compiled to WebAssembly. The only change
              is a small fix to a sound-effect loop that hangs in the web
              runtime. If you’d rather run it on your computer:
            </p>
            <ol className={styles.list}>
              <li>Download the zip and extract the whole folder.</li>
              <li>
                Double-click <code className={local.code}>TRANSIENT.jar</code>.
                The first load takes about ten seconds.
              </li>
              <li>
                Keep the .jar inside its folder, since it loads the levels and
                music from there. If you want to launch it from somewhere else,
                make a shortcut instead.
              </li>
            </ol>
            <p>
              I left my own save file in there, so see if you can beat my score!
            </p>
          </div>
        </section>
      </div>
    </Container>
  );
}
