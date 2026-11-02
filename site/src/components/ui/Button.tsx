import type {
  ButtonHTMLAttributes,
  MouseEventHandler,
  ReactNode,
  Ref,
} from "react";
import { Icon, type IconName } from "./Icon";
import { SmartLink } from "./SmartLink";
import { cx } from "./cx";
import styles from "./Button.module.css";

interface ButtonOwnProps {
  /** filled: primary action. tinted: secondary. plain: low emphasis. */
  variant?: "filled" | "tinted" | "plain";
  size?: "small" | "regular" | "large";
  /** Icon before the label. */
  icon?: IconName;
  /** Icon after the label. */
  trailingIcon?: IconName;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface ButtonAsButtonProps
  extends
    ButtonOwnProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
}

export interface ButtonAsLinkProps extends ButtonOwnProps {
  /** Renders a link styled as a button. */
  href: string;
  /** Force (true) or suppress (false) a new tab. Defaults to true for other websites. */
  newTab?: boolean;
  /** Download the linked file (optionally with a file name). */
  download?: boolean | string;
  "aria-label"?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ref?: Ref<HTMLAnchorElement>;
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function buttonClasses({
  variant = "filled",
  size = "regular",
  fullWidth = false,
  className,
  children,
}: ButtonOwnProps) {
  return cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    !children && styles.iconOnly,
    className,
  );
}

function ButtonContent({ icon, trailingIcon, children }: ButtonOwnProps) {
  return (
    <>
      {icon && <Icon name={icon} className={styles.icon} />}
      {children && <span className={styles.label}>{children}</span>}
      {trailingIcon && <Icon name={trailingIcon} className={styles.icon} />}
    </>
  );
}

/**
 * Capsule button. Renders a <button>, or a link when `href` is given.
 * Feedback is on pointer-down (scale 0.97), not on click.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { href, newTab, download, onClick, ref } = props;
    return (
      <SmartLink
        href={href}
        newTab={newTab}
        download={download === true ? "" : download || undefined}
        onClick={onClick}
        aria-label={props["aria-label"]}
        className={buttonClasses(props)}
        ref={ref}
      >
        <ButtonContent {...props} />
      </SmartLink>
    );
  }

  const {
    variant,
    size,
    icon,
    trailingIcon,
    fullWidth,
    className,
    children,
    type = "button",
    ...buttonProps
  } = props;
  const own = {
    variant,
    size,
    icon,
    trailingIcon,
    fullWidth,
    className,
    children,
  };
  return (
    <button type={type} className={buttonClasses(own)} {...buttonProps}>
      <ButtonContent {...own} />
    </button>
  );
}
