import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [promi, setPromi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getPromi() {
      const { data, error } = await supabase
        .from("PROMISAR")
        .select("*")
        .limit(1)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setPromi(data);
      }

      setLoading(false);
    }

    getPromi();
  }, []);

  if (loading) {
    return <p className="status">Laddar PROMI...</p>;
  }

  if (error) {
    return <p className="status">Fel: {error}</p>;
  }

  const points = promi["Svårighetsgrad"] * 10;

  return (
    <main className="app">
      <h1 className="logo">PROMI</h1>

      <section className="promi-card">
        <div className="promi-emoji">
          {promi.Emoji}
        </div>

        <h2>{promi.Namn}</h2>

        <p className="hitta">
          {promi.Hitta}
        </p>

        <div className="difficulty">
          <span>Svårighetsgrad</span>
          <strong>{promi["Svårighetsgrad"]}/3</strong>
        </div>

        <div className="points">
          +{points} poäng
        </div>
      </section>
    </main>
  );
}

export default App;
