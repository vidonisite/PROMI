import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

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
    return <p>Laddar PROMI...</p>;
  }

  if (error) {
    return <p>Fel: {error}</p>;
  }

  return (
    <main>
      <div>
        <span>{promi.Emoji}</span>
      </div>

      <h1>{promi.Namn}</h1>

      <p>{promi.Hitta}</p>

      <p>Svårighetsgrad: {promi["Svårighetsgrad"]}</p>

      <p>Bonus: {promi.Bonus}</p>
    </main>
  );
}

export default App;
