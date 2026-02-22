import React from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        isLoading ? styles.loading : "",
        className ?? "",
      ].join(" ")}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={styles.content}>{children}</span>
    </button>
  );
}