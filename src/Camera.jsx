import { useEffect, useRef, useState } from "react";
import "./Camera.css";

function Camera({ onClose, onPhotoTaken }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [takingPhoto, setTakingPhoto] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          },
          width: {
            ideal: 1920
          },
          height: {
            ideal: 1920
          }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (error) {
      console.error(error);

      setCameraError(
        "Kunde inte öppna kameran. Kontrollera att PROMI har tillgång till kameran."
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }
  }

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    setTakingPhoto(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const size = Math.min(
      video.videoWidth,
      video.videoHeight
    );

    const sourceX =
      (video.videoWidth - size) / 2;

    const sourceY =
      (video.videoHeight - size) / 2;

    canvas.width = 1000;
    canvas.height = 1000;

    context.drawImage(
      video,
      sourceX,
      sourceY,
      size,
      size,
      0,
      0,
      1000,
      1000
    );

    const image = canvas.toDataURL(
      "image/webp",
      0.85
    );

    setTimeout(() => {
      setPhoto(image);
      setTakingPhoto(false);
      stopCamera();
    }, 150);
  }

  function retakePhoto() {
    setPhoto(null);
    startCamera();
  }

  function usePhoto() {
    if (!photo) {
      return;
    }

    onPhotoTaken(photo);
  }

  if (photo) {
    return (
      <main className="camera-screen preview-screen">
        <div className="camera-top">
          <button
            className="camera-close"
            onClick={onClose}
          >
            ×
          </button>

          <span className="camera-title">
            PROMI CAMERA
          </span>

          <span className="camera-top-placeholder" />
        </div>

        <div className="photo-preview">
          <img
            src={photo}
            alt="Din tagna PROMI-bild"
          />
        </div>

        <div className="preview-controls">
          <button
            className="retake-button"
            onClick={retakePhoto}
          >
            TA OM
          </button>

          <button
            className="use-photo-button"
            onClick={usePhoto}
          >
            ANVÄND BILD
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="camera-screen">
      <div className="camera-top">
        <button
          className="camera-close"
          onClick={onClose}
        >
          ×
        </button>

        <span className="camera-title">
          PROMI CAMERA
        </span>

        <span className="camera-status">
          {cameraReady ? "● READY" : "●"}
        </span>
      </div>

      <div className="viewfinder-wrapper">
        <div className="viewfinder">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />

          <div className="viewfinder-corners">
            <span className="corner top-left" />
            <span className="corner top-right" />
            <span className="corner bottom-left" />
            <span className="corner bottom-right" />
          </div>

          {!cameraReady && !cameraError && (
            <div className="camera-loading">
              STARTAR KAMERA...
            </div>
          )}

          {cameraError && (
            <div className="camera-error">
              <p>{cameraError}</p>

              <button
                onClick={startCamera}
              >
                FÖRSÖK IGEN
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="camera-bottom">
        <div className="camera-info">
          <span>1:1</span>
          <span>1000 × 1000</span>
        </div>

        <button
          className={`shutter-button ${
            takingPhoto ? "taking" : ""
          }`}
          onClick={takePhoto}
          disabled={!cameraReady || takingPhoto}
          aria-label="Ta bild"
        >
          <span />
        </button>

        <div className="camera-info">
          <span>WEBP</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="hidden-canvas"
      />
    </main>
  );
}

export default Camera;
