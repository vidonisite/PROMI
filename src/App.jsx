import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [promisar, setPromisar] = useState([]);
  const [selectedPromi, setSelectedPromi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getPromisar() {
      const { data, error } = await supabase
        .from("PROMISAR")
        .select("*")
        .limit(6);

      if (error) {
        setError(error.message);
      } else {
        setPromisar(data);
      }

      setLoading(false);
    }

    getPromisar();
  }, []);

  if (loading) {
    return <p className="status">Laddar PROMISAR...</p>;
  }

  if (error) {
    return <p className="status">Fel: {error}</p>;
  }

  if (selectedPromi) {
    const points = selectedPromi["Svårighetsgrad"] * 10;

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
              Svårighetsgrad {selectedPromi["Svårighetsgrad"]}/3
            </span>

            <strong>+{points} poäng</strong>
          </div>

          <button className="start-button">
            Gör PROMIN
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <h1 className="logo">PROMI</h1>

      <div className="promi-grid">
        {promisar.map((promi) => (
          <button
            key={promi.id}
            className="promi-card"
            onClick={() => setSelectedPromi(promi)}
          >
            <span className="lock">🔒</span>
          </button>
        ))}
      </div>
    </main>
  );
}

export default App;
