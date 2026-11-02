"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import styles from "./YouTubeEmbed.module.css";

export type YouTubeEmbedProps = {
  /** The YouTube video id, e.g. "MEmqIJStfXQ". */
  id: string;
  /** The video's title; names the play button and the player frame. */
  title: string;
};

/**
 * A click-to-load YouTube player. Until the viewer presses play, the page only
 * shows YouTube's static thumbnail, so nothing from YouTube runs and no cookies
 * are set. The player itself comes from the privacy-enhanced
 * youtube-nocookie.com domain.
 */
export function YouTubeEmbed({ id, title }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Keep keyboard focus on the player once the button it replaced is gone.
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  return (
    <div className={styles.screen} data-playing={playing ? "" : undefined}>
      {playing ? (
        <iframe
          ref={frameRef}
          className={styles.frame}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          {/* A remote thumbnail, so the local image pipeline does not apply. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.poster}
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className={styles.scrim} aria-hidden="true" />
          <button
            type="button"
            className={styles.play}
            onClick={() => setPlaying(true)}
          >
            <Icon name="play" className={styles.playIcon} />
            <span className="visually-hidden">Play “{title}”</span>
          </button>
        </>
      )}
    </div>
  );
}
