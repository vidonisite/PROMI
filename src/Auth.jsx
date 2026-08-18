import { useState } from "react";
import { supabase } from "./lib/supabase";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    if (mode === "signup") {
      const {
        data,
        error: signupError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      // Profile skapas automatiskt av Supabase-triggern
      // när användaren skapas.

      if (data.session) {
        onLogin();
      } else {
        setError(
          "Kontot skapades! Kontrollera din e-post för att bekräfta kontot."
        );
      }
    } else {
      const {
        error: loginError
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        onLogin();
      }
    }

    setLoading(false);
  }

  return (
    <main>
      <h1>PROMI</h1>

      <h2>
        {mode === "login"
          ? "Logga in"
          : "Skapa konto"}
      </h2>

      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Användarnamn"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            required
          />
        )}

        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Laddar..."
            : mode === "login"
            ? "Logga in"
            : "Skapa konto"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setError("");

          setMode(
            mode === "login"
              ? "signup"
              : "login"
          );
        }}
      >
        {mode === "login"
          ? "Har du inget konto? Skapa konto"
          : "Har du redan ett konto? Logga in"}
      </button>
    </main>
  );
}

export default Auth;
