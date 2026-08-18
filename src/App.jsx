import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setSession(session);
      setCheckingAuth(false);
    }

    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (checkingAuth) {
    return <p>Laddar...</p>;
  }

  if (!session) {
    return (
      <Auth
        onLogin={() => {}}
      />
    );
  }

  return (
    <main className="app">
      <h1 className="logo">PROMI</h1>

      <p>Du är inloggad! 🎉</p>

      <button
        onClick={() =>
          supabase.auth.signOut()
        }
      >
        Logga ut
      </button>
    </main>
  );
}

export default App;
