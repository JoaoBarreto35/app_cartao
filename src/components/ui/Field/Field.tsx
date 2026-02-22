import React from "react";
import styles from "./Field.module.css";

type CommonProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

type InputProps = CommonProps & {
  as?: "input";
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

type SelectProps = CommonProps & {
  as: "select";
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>;
  children: React.ReactNode;
};

export type FieldProps = InputProps | SelectProps;

export function Field(props: FieldProps) {
  const describedByIds: string[] = [];
  const hintId = React.useId();
  const errorId = React.useId();

  if (props.hint) describedByIds.push(hintId);
  if (props.error) describedByIds.push(errorId);

  return (
    <label className={[styles.field, props.className ?? ""].join(" ")}>
      <span className={styles.label}>{props.label}</span>

      {props.as === "select" ? (
        <select
          {...props.selectProps}
          className={[styles.control, props.selectProps.className ?? ""].join(" ")}
          aria-invalid={props.error ? "true" : undefined}
          aria-describedby={describedByIds.length ? describedByIds.join(" ") : undefined}
        >
          {props.children}
        </select>
      ) : (
        <input
          {...props.inputProps}
          className={[styles.control, props.inputProps.className ?? ""].join(" ")}
          aria-invalid={props.error ? "true" : undefined}
          aria-describedby={describedByIds.length ? describedByIds.join(" ") : undefined}
        />
      )}

      {props.hint ? (
        <span id={hintId} className={styles.hint}>
          {props.hint}
        </span>
      ) : null}

      {props.error ? (
        <span id={errorId} className={styles.error} role="alert">
          {props.error}
        </span>
      ) : null}
    </label>
  );
}