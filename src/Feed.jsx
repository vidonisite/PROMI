import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./Feed.css";

function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.rpc("get_feed");

    if (error) {
      console.error("Feed error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setFeed(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="feed-page">
        <p className="status">Laddar flödet...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="feed-page">
        <p className="status">
          Fel: {error}
        </p>
      </main>
    );
  }

  return (
    <main className="feed-page">

      <h1 className="feed-title">
        Flödet
      </h1>

      {feed.length === 0 ? (
        <p className="status">
          Ingen har gjort någon PROMI ännu.
        </p>
      ) : (

        <div className="feed-list">

          {feed.map((item) => (
            <article
              className="feed-card"
              key={item.id}
            >

              {/* ANVÄNDARE */}

              <div className="feed-user">

                {item.profile_image ? (
                  <img
                    className="feed-profile-image"
                    src={item.profile_image}
                    alt=""
                  />
                ) : (
                  <div className="feed-profile-placeholder">
                    👤
                  </div>
                )}

                <strong>
                  {item.username}
                </strong>

              </div>


              {/* BILD */}

              <img
                className="feed-image"
                src={item.image_url}
                alt={item.promi_name}
              />


              {/* PROMI INFO */}

              <div className="feed-info">

                <span className="feed-emoji">
                  {item.promi_emoji}
                </span>

                <div>

                  <strong>
                    {item.promi_name}
                  </strong>

                  <p>
                    Klarade en PROMI!
                  </p>

                </div>

              </div>

            </article>
          ))}

        </div>
      )}

    </main>
  );
}

export default Feed;
