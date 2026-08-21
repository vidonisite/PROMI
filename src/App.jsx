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

  const [removingPromiId, setRemovingPromiId] = useState(null);
  const [enteringPromiId, setEnteringPromiId] = useState(null);

  const [rewardPage, setRewardPage] = useState(null);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [rewardStreak, setRewardStreak] = useState(0);
  const [streakIncreased, setStreakIncreased] = useState(false);

  const [dailyReward, setDailyReward] = useState(null);
  const [dailyCompleted, setDailyCompleted] = useState(0);

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
        await loadDailyReward();
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




  async function loadDailyReward() {
    if (!session) {
      return;
    }
  
    const today = new Date().toISOString().split("T")[0];
  
    // Hämta dagens reward-rad
    const {
      data: reward,
      error: rewardError,
    } = await supabase
      .from("daily_rewards")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("date", today)
      .maybeSingle();
  
    if (rewardError) {
      console.error(rewardError);
      return;
    }
  
    setDailyReward(reward);
  
    // Räkna dagens genomförda PROMISAR
    const {
      data: completed,
      error: completedError,
    } = await supabase
      .from("completed_promis")
      .select("id, promi_id, completed_at")
      .eq("user_id", session.user.id)
      .gte("completed_at", `${today}T00:00:00`)
      .lt("completed_at", `${today}T23:59:59.999`);
  
    if (completedError) {
      console.error(completedError);
      return;
    }
  
    setDailyCompleted(completed?.length ?? 0);
  }

  
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
    // Om PROMI:n redan är upplåst → öppna direkt
    if (unlockedPromis.includes(promi.id)) {
      setUnlockingPromi(null);
      setUnlockPhase("idle");
      setSelectedPromi(promi);
      return;
    }
  
    // Låst → starta upplåsningsanimationen
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
  
    // Stoppa eventuell pågående upplåsningsanimation
    setUnlockingPromi(null);
    setUnlockPhase("idle");
  }

  /*
   * GENOMFÖR PROMI
   */






  async function compressImageToWebP(
    imageSource,
    maxSize = 1000,
    quality = 0.8
  ) {
    const image = new Image();
  
    image.src = imageSource;
  
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
  
    let width = image.naturalWidth;
    let height = image.naturalHeight;
  
    // Behåll proportionerna och sätt längsta sidan till max 1000 px
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round(
          (height / width) * maxSize
        );
  
        width = maxSize;
      } else {
        width = Math.round(
          (width / height) * maxSize
        );
  
        height = maxSize;
      }
    }
  
    const canvas = document.createElement("canvas");
  
    canvas.width = width;
    canvas.height = height;
  
    const context = canvas.getContext("2d");
  
    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );
  
    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        resolve,
        "image/webp",
        quality
      );
    });
  
    if (!blob) {
      throw new Error(
        "Kunde inte konvertera bilden till WebP."
      );
    }
  
    return blob;
  }




  

  async function completePromi() {
    if (!selectedPromi || !takenPhoto) {
      return;
    }
  
    setError("");
  
    const completedId = selectedPromi.id;
    const userId = session.user.id;
  
    try {
  
      // =========================================
      // 1. KOMPIMERA + KONVERTERA TILL WEBP
      // =========================================
  
      const compressedImage =
        await compressImageToWebP(
          takenPhoto,
          1000,
          0.8
        );
  
  
      // =========================================
      // 2. SKAPA FILNAMN
      // =========================================
  
      const fileName =
        `${userId}/${completedId}-${Date.now()}.webp`;
  
  
      // =========================================
      // 3. LADDA UPP TILL SUPABASE STORAGE
      // =========================================
  
      const {
        error: uploadError,
      } = await supabase.storage
        .from("promi-photos")
        .upload(
          fileName,
          compressedImage,
          {
            contentType: "image/webp",
            upsert: false,
          }
        );
  
      if (uploadError) {
        console.error(uploadError);
  
        setError(
          uploadError.message
        );
  
        return;
      }
  
  
      // =========================================
      // 4. HÄMTA BILDENS URL
      // =========================================
  
      const {
        data: publicUrlData,
      } = supabase.storage
        .from("promi-photos")
        .getPublicUrl(fileName);
  
      const imageUrl =
        publicUrlData.publicUrl;
  
  
      // =========================================
      // 5. SPARA GENOMFÖRANDET
      // =========================================
  
      const {
        data,
        error,
      } = await supabase.rpc(
        "complete_promi",
        {
          p_promi_id: completedId,
          p_image_url: imageUrl,
        }
      );
  
      if (error) {
        console.error(error);
  
        setError(
          error.message
        );
  
        return;
      }
  
  
      // =========================================
      // 6. BELÖNING
      // =========================================
  
      console.log(
        "PROMI completed:",
        data
      );
  
      setRewardPoints(
        data.points_added
      );
  
      setRewardStreak(
        data.streak
      );
  
      setStreakIncreased(
        data.streak_increased
      );
  
  
      // =========================================
      // 7. TA BORT PROMIN-KORTET
      // =========================================
  
      setRemovingPromiId(
        completedId
      );
  
      setTakenPhoto(null);
      setSelectedPromi(null);
  
  
      // =========================================
      // 8. VISA REWARD
      // =========================================
  
      setRewardPage(
        "congrats"
      );
  
    } catch (error) {
  
      console.error(error);
  
      setError(
        error.message
      );
    }
  }


  function nextRewardPage() {

    if (rewardPage === "congrats") {
      setRewardPage("points");
      return;
    }
  
    if (rewardPage === "points") {
  
      if (streakIncreased) {
        setRewardPage("streak");
      } else {
        finishRewards();
      }
  
      return;
    }
  
    if (rewardPage === "streak") {
      finishRewards();
    }
  }


  async function finishRewards() {
    setRewardPage(null);
  
    const completedId = removingPromiId;
  
    if (!completedId) {
      return;
    }
  
    const oldIds = promisar.map(
      (promi) => promi.id
    );
  
    // Låt kortet falla först
    setTimeout(async () => {
  
      await loadPromisar();
  
      setPromisar((current) => {
  
        const newPromi = current.find(
          (promi) => !oldIds.includes(promi.id)
        );
  
        if (newPromi) {
  
          setEnteringPromiId(newPromi.id);
  
          setTimeout(() => {
            setEnteringPromiId(null);
          }, 850);
  
        }
  
        return current;
      });
  
      setRemovingPromiId(null);
  
      if (session) {
        await loadProfile(session.user.id);
      }
  
    }, 900);
  
    setRewardPoints(0);
    setRewardStreak(0);
    setStreakIncreased(false);
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




  


  if (rewardPage) {
    return (
      <main className="reward-screen">
  
        {/* =========================
            GRATTIS
        ========================= */}
  
        {rewardPage === "congrats" && (
          <section className="reward-page">
  
            <img
              src="https://cdn.pixabay.com/animation/2024/07/16/16/50/16-50-52-689_512.gif"
              className="reward-gif"
              alt=""
            />
  
            <h1>
              GRATTIS!!!
            </h1>
  
            <p>
              Du klarade PROMIN!
            </p>
  
            <button
              className="reward-button"
              onClick={nextRewardPage}
            >
              NÄSTA
            </button>
  
          </section>
        )}
  
  
        {/* =========================
            POÄNG
        ========================= */}
  
        {rewardPage === "points" && (
          <section className="reward-page">
  
            <img
              src="https://cdn.pixabay.com/animation/2025/06/03/04/09/04-09-45-17_512.gif"
              className="reward-gif"
              alt=""
            />
  
            <h2>
              Vill du ha lite poäng?
            </h2>
  
            <strong className="reward-points">
              +{rewardPoints}
            </strong>
  
            <span className="reward-points-label">
              POÄNG
            </span>
  
            <button
              className="reward-button"
              onClick={nextRewardPage}
            >
              NÄSTA
            </button>
  
          </section>
        )}
  
  
        {/* =========================
            STREAK
        ========================= */}
  
        {rewardPage === "streak" && (
          <section className="reward-page">
  
            <img
              src="https://cdn.pixabay.com/animation/2025/06/26/05/26/05-26-59-506_512.gif"
              className="reward-gif"
              alt=""
            />
  
            <strong className="reward-streak">
              {rewardStreak}
            </strong>
  
            <span className="reward-streak-label">
              DAGARS STREAK
            </span>
  
            <button
              className="reward-button"
              onClick={nextRewardPage}
            >
              KLAR
            </button>
  
          </section>
        )}
  
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
            setUnlockingPromi(null);
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

              <img
                src = {profile?.profilbild}
              />
              
            </div>


            <div className="daily-progress">

              <div className="daily-progress-header">
                <span>AVKLARADE PROMISAR IDAG</span>
            
                <strong>
                  {dailyCompleted}/
                  {dailyReward?.reward_10_claimed
                    ? 10
                    : dailyReward?.reward_5_claimed
                    ? 10
                    : dailyReward?.reward_3_claimed
                    ? 5
                    : 3}
                </strong>
              </div>
            
              <div className="progress-bar">
            
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      Math.min(
                        dailyCompleted /
                          (dailyReward?.reward_10_claimed
                            ? 10
                            : dailyReward?.reward_5_claimed
                            ? 10
                            : dailyReward?.reward_3_claimed
                            ? 5
                            : 3),
                        1
                      ) * 100
                    }%`,
                  }}
                />
            
              </div>
            
              <div className="reward-goal">
            
                {!dailyReward?.reward_3_claimed &&
                  dailyCompleted < 3 && (
                    <>
                      🎁 Gör 3 PROMISAR → <strong>+20 poäng</strong>
                    </>
                  )}
            
                {!dailyReward?.reward_3_claimed &&
                  dailyCompleted >= 3 && (
                    <>
                      🎁 Belöning upplåst! <strong>+20 poäng</strong>
                    </>
                  )}
            
                {dailyReward?.reward_3_claimed &&
                  !dailyReward?.reward_5_claimed &&
                  dailyCompleted < 5 && (
                    <>
                      🎁 Gör 5 PROMISAR → <strong>nästa belöning</strong>
                    </>
                  )}
            
                {dailyReward?.reward_3_claimed &&
                  !dailyReward?.reward_5_claimed &&
                  dailyCompleted >= 5 && (
                    <>
                      🎁 Belöning upplåst!
                    </>
                  )}
            
                {dailyReward?.reward_5_claimed &&
                  !dailyReward?.reward_10_claimed &&
                  dailyCompleted < 10 && (
                    <>
                      🎁 Gör 10 PROMISAR → <strong>sista belöningen</strong>
                    </>
                  )}
            
                {dailyReward?.reward_5_claimed &&
                  !dailyReward?.reward_10_claimed &&
                  dailyCompleted >= 10 && (
                    <>
                      🎁 Sista belöningen upplåst!
                    </>
                  )}
            
                {dailyReward?.reward_10_claimed && (
                  <>
                    ✨ Alla dagens belöningar är avklarade!
                  </>
                )}
            
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

          <span className="dagsförenpromi">
              <h2>Dags för en PROMI?</h2>
            </span>

          <div className="promi-grid">

            

            {promisar.slice(0, 4).map((promi) => (

              <button
                key={promi.id}
                className={`promi-card ${
                  removingPromiId === promi.id
                    ? "promi-card-removing"
                    : ""
                } ${
                  enteringPromiId === promi.id
                    ? "promi-card-entering"
                    : ""
                }`}
                onClick={() => unlockPromi(promi)}
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
      
        {/* =========================
            HEM
        ========================= */}
      
        <button
          className={`nav-item ${
            activeTab === "bo" ? "active" : ""
          }`}
          onClick={() => setActiveTab("bo")}
        >
          <span className="nav-icon">
      
            {/* OUTLINE */}
            <svg
              className="icon-outline"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
              <path d="M10 12h4v4h-4l0 -4" />
            </svg>
      
            {/* FILLED */}
            <svg
              className="icon-filled"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.793 8.707h-3a1.5 1.5 0 0 0 -1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5 -1.5v-3a1.5 1.5 0 0 0 -1.5 -1.5" />
            </svg>
      
          </span>
        </button>
      
      
        {/* =========================
            LEADERBOARD
        ========================= */}
      
        <button
          className={`nav-item ${
            activeTab === "leaderboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <span className="nav-icon">
      
            {/* OUTLINE */}
            <svg
              className="icon-outline"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M8 21l8 0" />
              <path d="M12 17l0 4" />
              <path d="M7 4l10 0" />
              <path d="M17 4v8a5 5 0 0 1 -10 0v-8" />
              <path d="M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
              <path d="M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            </svg>
      
            {/* FILLED */}
            <svg
              className="icon-filled"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M17 3a1 1 0 0 1 .993 .883l.007 .117v2.17a3 3 0 1 1 0 5.659v.171a6.002 6.002 0 0 1 -5 5.917v2.083h3a1 1 0 0 1 .117 1.993l-.117 .007h-8a1 1 0 0 1 -.117 -1.993l.117 -.007h3v-2.083a6.002 6.002 0 0 1 -4.996 -5.692l-.004 -.225v-.171a3 3 0 0 1 -3.996 -2.653l-.003 -.176l.005 -.176a3 3 0 0 1 .005 -.176a3 3 0 0 1 3.995 -2.654l-.001 -2.17a1 1 0 0 1 1 -1h10zm-12 5a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m14 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2" />
            </svg>
      
          </span>
        </button>
      
      
        {/* =========================
            FLÖDE
        ========================= */}
      
        <button
          className={`nav-item ${
            activeTab === "feed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("feed")}
        >
          <span className="nav-icon">
      
            {/* OUTLINE */}
            <svg
              className="icon-outline"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M5 4h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
              <path d="M5 16h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
              <path d="M15 12h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1" />
              <path d="M15 4h4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1" />
            </svg>
      
            {/* FILLED */}
            <svg
              className="icon-filled"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M9 3a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2zm10 -4a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 -8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z" />
            </svg>
      
          </span>
        </button>
      
      
        {/* =========================
            SKAPA
        ========================= */}
      
        <button
          className={`nav-item ${
            activeTab === "create" ? "active" : ""
          }`}
          onClick={() => setActiveTab("create")}
        >
          <span className="nav-icon">
      
            {/* OUTLINE */}
            <svg
              className="icon-outline"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
              <path d="M13.5 6.5l4 4" />
              <path d="M16 19h6" />
              <path d="M19 16v6" />
            </svg>
      
            {/* FILLED */}
            <svg
              className="icon-filled"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                stroke="none"
                d="M0 0h24v24H0z"
                fill="none"
              />
              <path d="M16.5 3.5a2.5 2.5 0 0 1 3.536 3.536l-10.5 10.5a2 2 0 0 1 -1.414 .586h-4.122a1 1 0 0 1 -1 -1v-4.122a2 2 0 0 1 .586 -1.414l10.5 -10.5a2.5 2.5 0 0 1 2.414 -.586zm-1.121 1.121l-10.5 10.5a.5 .5 0 0 0 -.146 .354v3.122h3.122a.5 .5 0 0 0 .354 -.146l10.5 -10.5a1 1 0 0 0 -1.414 -1.414z" />
              <path d="M16 19h6" />
              <path d="M19 16v6" />
            </svg>
      
          </span>
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
