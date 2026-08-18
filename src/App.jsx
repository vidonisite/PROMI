import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function App() {
  const [promi, setPromi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getPromi() {
      const { data, error } = await supabase
        .from("promisar")
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
    return <p>Laddar PROMI...</p>;
  }

  if (error) {
    return <p>Fel: {error}</p>;
  }

  return (
    <main>
      <h1>PROMI</h1>

      {promi && (
        <section>
          <h2>{promi.title}</h2>
          <p>{promi.description}</p>
          <p>{promi.points} poäng</p>
        </section>
      )}
    </main>
  );
}

export default App;
