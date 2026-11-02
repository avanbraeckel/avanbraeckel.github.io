import type { ReactNode, SVGProps } from "react";

/* Stroke icons share a 24px grid and a 1.75 stroke; brand marks are filled. */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const icons = {
  arrow: (
    <g {...stroke}>
      <path d="M4.5 12h15" />
      <path d="M13.5 6l6 6-6 6" />
    </g>
  ),
  external: (
    <g {...stroke}>
      <path d="M8 6.5h9.5V16" />
      <path d="M17.5 6.5 6.5 17.5" />
    </g>
  ),
  download: (
    <g {...stroke}>
      <path d="M12 4v11" />
      <path d="M7 10.5l5 5 5-5" />
      <path d="M5 19.5h14" />
    </g>
  ),
  play: (
    <path
      d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.4-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6Z"
      fill="currentColor"
    />
  ),
  pause: (
    <g fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1.25" />
      <rect x="14" y="5" width="4" height="14" rx="1.25" />
    </g>
  ),
  document: (
    <g {...stroke}>
      <path d="M13.5 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z" />
      <path d="M13.5 3.5v5h5" />
      <path d="M9 13h6M9 16.5h6" />
    </g>
  ),
  close: (
    <g {...stroke}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </g>
  ),
  menu: (
    <g {...stroke}>
      <path d="M4.5 8.5h15M4.5 15.5h15" />
    </g>
  ),
  expand: (
    <g {...stroke}>
      <path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" />
    </g>
  ),
  collapse: (
    <g {...stroke}>
      <path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" />
    </g>
  ),
  keyboard: (
    <g {...stroke}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 14h8" />
    </g>
  ),
  github: (
    <path
      fill="currentColor"
      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
    />
  ),
  linkedin: (
    <path
      fill="currentColor"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

export interface IconProps extends Omit<
  SVGProps<SVGSVGElement>,
  "children" | "name"
> {
  name: IconName;
  /** Width and height. Defaults to 1em so the icon follows the text size. */
  size?: number | string;
  /** Accessible label. Without one the icon is decorative (aria-hidden). */
  title?: string;
}

/** Inline SVG icon that inherits currentColor. */
export function Icon({ name, size = "1em", title, ...rest }: IconProps) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      focusable="false"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      aria-label={title}
      data-icon={name}
      style={{
        flexShrink: 0,
        display: "inline-block",
        verticalAlign: "middle",
      }}
      {...rest}
    >
      {icons[name]}
    </svg>
  );
}
