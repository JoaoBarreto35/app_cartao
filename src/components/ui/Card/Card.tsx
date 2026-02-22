import React from "react";
import styles from "./Card.module.css";

export type CardProps = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, subtitle, right, children, className }: CardProps) {
  return (
    <section className={[styles.card, className ?? ""].join(" ")}>
      {(title || subtitle || right) && (
        <header className={styles.header}>
          <div className={styles.titles}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {right ? <div className={styles.right}>{right}</div> : null}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  );
}