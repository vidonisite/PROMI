import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [promisar, setPromisar] = useState([]);
  const [selectedPromi, setSelectedPromi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function startApp() {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        await loadPromisar();
      }

      setLoading(false);
    }

    startApp();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session) {
          await loadPromisar();
        } else {
          setPromisar([]);
          setSelectedPromi(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadPromisar() {
    setError("");

    const { data, error } = await supabase.rpc(
      "get_daily_promis"
    );

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setPromisar(data || []);
  }

  if (loading) {
    return <p className="status">Laddar PROMI...</p>;
  }

  if (!session) {
    return <Auth onLogin={() => {}} />;
  }

  // DETAIL VIEW
  if (selectedPromi) {
    const points =
      selectedPromi["Svårighetsgrad"] * 10;

    return (
      <main className="app">
        <button
          className="back-button"
          onClick={() => setSelectedPromi(null)}
        >
          ← Tillbaka
        </button>

        <section className="detail-card">
          <div className="detail-emoji">
            {selectedPromi.Emoji}
          </div>

          <h1>{selectedPromi.Namn}</h1>

          <p className="detail-hitta">
            {selectedPromi.Hitta}
          </p>

          <div className="detail-info">
            <span>
              Svårighetsgrad{" "}
              {selectedPromi["Svårighetsgrad"]}/3
            </span>

            <strong>
              +{points} poäng
            </strong>
          </div>

          {selectedPromi.Bonus && (
            <div className="bonus-preview">
              <strong>Bonus</strong>
              <p>{selectedPromi.Bonus}</p>
            </div>
          )}

          <button className="start-button">
            GÖR PROMIN
          </button>
        </section>
      </main>
    );
  }

  // HOME
  return (
    <main className="app">
      <h1 className="logo">PROMI</h1>

      {error && (
        <p className="status">
          Fel: {error}
        </p>
      )}

      <div className="promi-grid">
        {promisar.map((promi) => (
          <button
            key={promi.id}
            className="promi-card"
            onClick={() =>
              setSelectedPromi(promi)
            }
          >
            <span className="lock">🔒</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default App;
