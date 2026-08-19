import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import Camera from "./Camera";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);

  const [promisar, setPromisar] = useState([]);
  const [profile, setProfile] = useState(null);

  const [selectedPromi, setSelectedPromi] = useState(null);
  const [unlockingPromi, setUnlockingPromi] = useState(null);

  const [unlockedPromis, setUnlockedPromis] = useState([]);

  const [unlockPhase, setUnlockPhase] = useState("idle");

  const [takenPhoto, setTakenPhoto] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("bo");

  /*
   * STARTA APPEN
   */

  useEffect(() => {
    async function startApp() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        await loadPromisar();
        await loadProfile(session.user.id);
      }

      setLoading(false);
    }

    startApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session) {
          await loadPromisar();
          await loadProfile(session.user.id);
        } else {
          setPromisar([]);
          setProfile(null);
          setSelectedPromi(null);
          setTakenPhoto(null);
          setCameraOpen(false);
          setUnlockingPromi(null);
          setUnlockedPromis([]);
          setUnlockPhase("idle");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * UPPLÅSNINGSANIMATION
   */

  useEffect(() => {
    if (!unlockingPromi) {
      return;
    }

    if (unlockPhase === "unlocking") {
      const timer = setTimeout(() => {
        setSelectedPromi(unlockingPromi);
        setUnlockPhase("transitioning");
      }, 1350);

      return () => clearTimeout(timer);
    }

    if (unlockPhase === "transitioning") {
      const timer = setTimeout(() => {
        const promi = unlockingPromi;

        setUnlockedPromis((current) => {
          if (current.includes(promi.id)) {
            return current;
          }

          return [...current, promi.id];
        });

        setUnlockingPromi(null);
        setUnlockPhase("idle");
      }, 850);

      return () => clearTimeout(timer);
    }
  }, [unlockingPromi, unlockPhase]);

  /*
   * HÄMTA DAGENS PROMISAR
   */

  async function loadPromisar() {
    setError("");

    const {
      data,
      error,
    } = await supabase.rpc("get_daily_promis");

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setPromisar(data || []);
  }

  /*
   * HÄMTA PROFIL
   */

  async function loadProfile(userId) {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setProfile(data);
  }

  /*
   * KLICKA PÅ PROMI
   */

  function unlockPromi(promi) {
    if (unlockedPromis.includes(promi.id)) {
      setSelectedPromi(promi);
      return;
    }

    setUnlockingPromi(promi);
    setUnlockPhase("unlocking");
  }

  /*
   * ÖPPNA KAMERA
   */

  function openCamera() {
    setCameraOpen(true);
  }

  /*
   * STÄNG KAMERA
   */

  function closeCamera() {
    setCameraOpen(false);
  }

  /*
   * BILD TAGEN
   */

  function handlePhotoTaken(photo) {
    setTakenPhoto(photo);
    setCameraOpen(false);
  }

  /*
   * TILLBAKA TILL STARTSIDAN
   */

  function backToHome() {
    setSelectedPromi(null);
    setTakenPhoto(null);
    setCameraOpen(false);
  }

  /*
   * GENOMFÖR PROMI
   */

  async function completePromi() {
    if (!selectedPromi) {
      return;
    }

    setError("");

    const {
      error,
    } = await supabase.rpc(
      "complete_promi",
      {
        p_promi_id: selectedPromi.id,
      }
    );

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    await loadPromisar();

    if (session) {
      await loadProfile(session.user.id);
    }

    setTakenPhoto(null);
    setSelectedPromi(null);
  }

  /*
   * LOADING
   */

  if (loading) {
    return (
      <p className="status">
        Laddar PROMI...
      </p>
    );
  }

  /*
   * INTE INLOGGAD
   */

  if (!session) {
    return <Auth onLogin={() => {}} />;
  }

  /*
   * KAMERA
   */

  if (cameraOpen && selectedPromi) {
    return (
      <Camera
        onClose={closeCamera}
        onPhotoTaken={handlePhotoTaken}
      />
    );
  }

  /*
   * BILDEN ÄR TAGEN
   */

  if (takenPhoto && selectedPromi) {
    const points =
      selectedPromi["Svårighetsgrad"] * 10;

    return (
      <main className="app">

        <button
          className="back-button"
          onClick={backToHome}
        >
          ← Tillbaka
        </button>

        <section className="detail-card">

          <img
            className="taken-photo"
            src={takenPhoto}
            alt="Din PROMI-bild"
          />

          <h1>
            {selectedPromi.Namn}
          </h1>

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

          {error && (
            <p className="status">
              Fel: {error}
            </p>
          )}

          <button
            className="start-button"
            onClick={completePromi}
          >
            FORTSÄTT
          </button>

        </section>

      </main>
    );
  }

  /*
   * DETAIL VIEW
   */

  if (selectedPromi) {
    const points =
      selectedPromi["Svårighetsgrad"] * 10;

    return (
      <main
        className={
          unlockPhase === "transitioning"
            ? "app detail-enter"
            : "app"
        }
      >

        <button
          className="back-button"
          onClick={() => {
            setSelectedPromi(null);
            setUnlockPhase("idle");
          }}
        >
          ← Tillbaka
        </button>

        <section className="detail-card">

          <div className="detail-emoji">
            {selectedPromi.Emoji}
          </div>

          <h1>
            {selectedPromi.Namn}
          </h1>

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

              <strong>
                Bonus
              </strong>

              <p>
                {selectedPromi.Bonus}
              </p>

            </div>
          )}

          {error && (
            <p className="status">
              Fel: {error}
            </p>
          )}

          <button
            className="start-button"
            onClick={openCamera}
          >
            GÖR PROMIN
          </button>

        </section>

      </main>
    );
  }

  /*
   * HUVUDAPPEN
   */

  return (
    <main className="app">

      {/* =========================
          BO
      ========================= */}

      {activeTab === "bo" && (
        <>

          {/* POÄNG + STREAK */}

          <div className="stats-section">

            <div className="stats-display">

              <div className="stat-card">

                <span className="stat-icon">
                  ★
                </span>

                <div className="stat-content">

                  <span className="stat-label">
                    POÄNG
                  </span>

                  <strong>
                    {profile?.poäng ?? 0}
                  </strong>

                </div>

              </div>


              <div className="stat-card">

                <span className="stat-icon">
                  🔥
                </span>

                <div className="stat-content">

                  <span className="stat-label">
                    STREAK
                  </span>

                  <strong>
                    {profile?.streak ?? 0}
                  </strong>

                </div>

              </div>

            </div>

          </div>


          {/* FELMEDDELANDE */}

          {error && (
            <p className="status">
              Fel: {error}
            </p>
          )}


          {/* PROMISAR */}

          <div className="promi-grid">

            <span className="dagsförenpromi">
              <h2>Dags för en PROMI?</h2>
            </span>

            {promisar.slice(0, 4).map((promi) => (

              <button
                key={promi.id}
                className="promi-card"
                onClick={() =>
                  unlockPromi(promi)
                }
              >

                <span className="lock">

                  {unlockedPromis.includes(
                    promi.id
                  )
                    ? promi.Emoji
                    : "🔒"}

                </span>

              </button>

            ))}

          </div>

        </>
      )}


      {/* =========================
          LEADERBOARD
      ========================= */}

      {activeTab === "leaderboard" && (
        <div className="placeholder-page">

          <h1>
            Leaderboard
          </h1>

        </div>
      )}


      {/* =========================
          FLÖDET
      ========================= */}

      {activeTab === "feed" && (
        <div className="placeholder-page">

          <h1>
            Flödet
          </h1>

        </div>
      )}


      {/* =========================
          SKAPA
      ========================= */}

      {activeTab === "create" && (
        <div className="placeholder-page">

          <h1>
            Skapa
          </h1>

        </div>
      )}


      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="bottom-nav">

        <button
          className={
            activeTab === "bo"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setActiveTab("bo")
          }
        >
          <span>🏠</span>
          <small>Bo</small>
        </button>


        <button
          className={
            activeTab === "leaderboard"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setActiveTab("leaderboard")
          }
        >
          <span>🏆</span>
          <small>Leaderboard</small>
        </button>


        <button
          className={
            activeTab === "feed"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setActiveTab("feed")
          }
        >
          <span>✨</span>
          <small>Flödet</small>
        </button>


        <button
          className={
            activeTab === "create"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setActiveTab("create")
          }
        >
          <span>＋</span>
          <small>Skapa</small>
        </button>

      </nav>


      {/* =========================
          UPPLÅSNINGSOVERLAY
      ========================= */}

      {unlockingPromi && (

        <div
          className={
            unlockPhase === "transitioning"
              ? "unlock-overlay unlock-transitioning"
              : "unlock-overlay"
          }
        >

          <div className="unlock-icon">

            <span className="unlock-lock">
              🔒
            </span>

            <span className="unlock-emoji">
              {unlockingPromi.Emoji}
            </span>

          </div>

        </div>

      )}

    </main>
  );
}

export default App;
