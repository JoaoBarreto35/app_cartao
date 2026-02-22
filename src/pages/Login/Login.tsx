import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import { PageShell } from "../../components/layout/PageShell/PageShell";
import { Card } from "../../components/ui/Card/Card";
import { Field } from "../../components/ui/Field/Field";
import { Button } from "../../components/ui/Button/Button";
import { ErrorState } from "../../components/ui/State/ErrorState";

import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
    }

    setLoading(false);
  }

  return (
    <PageShell title="Entrar" subtitle="Acesse sua conta para continuar">
      <div className={styles.center}>
        <Card title="Login" subtitle="Informe seu email e senha">
          <form onSubmit={signIn} className={styles.form}>
            {msg ? (
              <ErrorState title="Não foi possível entrar" description={msg} />
            ) : null}

            <Field
              label="Email"
              as="input"
              inputProps={{
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                autoComplete: "email",
                placeholder: "voce@email.com",
                required: true,
                disabled: loading,
              }}
            />

            <Field
              label="Senha"
              as="input"
              inputProps={{
                type: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                autoComplete: "current-password",
                placeholder: "••••••••",
                required: true,
                disabled: loading,
              }}
            />

            <Button
              type="submit"
              disabled={!email || !password || loading}
              isLoading={loading}
            >
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}