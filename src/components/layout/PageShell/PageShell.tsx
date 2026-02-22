import styles from "./PageShell.module.css";
import utils from "../../../styles/utils.module.css";
import logo from "../../../assets/logo.png";



export function PageShell({
  title,
  subtitle,
  breadcrumbs,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={utils.container}>
          <div className={styles.topRow}>
            <div className={styles.left}>
              <img src={logo} alt="cartao-app" height={32} />
              {breadcrumbs ? <div className={styles.breadcrumbs}>{breadcrumbs}</div> : null}
              <h1 className={styles.title}>{title}</h1>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {right ? <div className={styles.right}>{right}</div> : null}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={utils.container}>{children}</div>
      </main>
    </div>
  );
}