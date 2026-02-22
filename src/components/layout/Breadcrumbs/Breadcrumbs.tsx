import { Link } from "react-router-dom";
import styles from "./Breadcrumbs.module.css";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.nav} aria-label="Breadcrumb">
      <ol className={styles.ol}>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={styles.li}>
              {c.to && !isLast ? (
                <Link className={styles.link} to={c.to}>
                  {c.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current={isLast ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!isLast ? <span className={styles.sep} aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}