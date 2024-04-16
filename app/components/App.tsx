"use client";
import React, { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import { runDetector } from "../utils/runDetector";
import { getStoredSetup, storeSetup } from "../utils/storeSetup";
import Webcam from "react-webcam";
import Menu from "./nav/Menu";
import Splash from "./nav/Splash";
import Message from "./nav/Message";
import Drawing from "./Drawing";
import Cursor from "./Cursor";
import "../styles.scss";
import { clearCanvases } from "../utils";
{
  /* <pre>{JSON.stringify(setup, null, 4)}</pre> */
}

interface Cursor {
  x: number;
  y: number;
  isPinched: boolean;
  isWagging: boolean;
}

interface Setup {
  [key: string]: string | number | boolean | object | null;
}

interface InputResolution {
  width: number;
  height: number;
}

const App: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSetupLoaded, setIsSetupLoaded] = useState<boolean>(false);
  const [scribble, setScribble] = useState<any[]>([]);
  const [scribbleNewArea, setScribbleNewArea] = useState<any[]>([]);
  const [cursor, setCursor] = useState<Cursor>({
    x: 0,
    y: 0,
    isPinched: false,
    isWagging: false
  });
  const [setup, setSetup] = useState<Setup>(getStoredSetup());
  const [stopDetector, setStopDetector] = useState<Function | null>(null);
  const [shouldRunDetector, setShouldRunDetector] = useState<boolean>(false);
  const [inputResolution, setInputResolution] = useState<InputResolution>({
    width: 0,
    height: 0
  });
  const [message, setMessage] = useState<string>("");

  const setupRef = useRef<Setup>(setup);
  const webcamRef = useRef<Webcam | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSetup(getStoredSetup());
      setInputResolution({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setIsSetupLoaded(true);
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key) {
        setSetup((prevSetup) => {
          return { ...prevSetup, pressedKey: event.key };
        });
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      setSetup((prevSetup) => {
        return { ...prevSetup, pressedKey: "" };
      });
      if (event.key === "Backspace") {
        clearPaths();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isClient]);

  useEffect(() => {
    if (setup.doesWagDelete && cursor.isWagging && setup.pattern !== "canvas") {
      clearPaths();
    }
  }, [cursor.isWagging, setup.pattern, setup.doesWagDelete]);

  useEffect(() => {
    if (!cursor.isPinched && scribbleNewArea.length > 0) {
      if (scribbleNewArea.length > 0) {
        setScribbleNewArea((prevScribbleNewArea) => {
          setScribble((prevScribble) => {
            return [...prevScribble, prevScribbleNewArea];
          });
          return [];
        });
      }
    }
  }, [cursor.isPinched, scribbleNewArea.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSetup((prevSetup) => {
      const { id, value, type } = event.target;
      const nextSetup = { ...prevSetup };
      if (type === "checkbox") {
        nextSetup[id] = !nextSetup[id];
      } else {
        nextSetup[id] = ["number", "range"].includes(type)
          ? Number(value)
          : value;
      }
      storeSetup(nextSetup);
      return nextSetup;
    });
  };

  const handlePlayButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setIsStarted((prevIsStarted) => {
      setSetup((prevSetup) => {
        if (stopDetector && prevIsStarted) {
          try {
            stopDetector();
          } catch (error) {
            console.error("An error occurred:", error);
          }
          setIsLoaded(false);
        }
        setShouldRunDetector(!prevIsStarted);
        return prevSetup;
      });
      return !prevIsStarted;
    });
  };

  const handleVideoLoad = (
    videoNode: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const video = videoNode.currentTarget;
    if (video.readyState !== 4) return;
    if (isLoaded) return;
    if (shouldRunDetector) {
      const { videoWidth, videoHeight } = video;
      if (inputResolution.width >= 768) {
        setInputResolution({ width: videoWidth, height: videoHeight });
      }
      const dctx = drawingCanvasRef.current?.getContext("2d") || null;
      const pctx = previewCanvasRef.current?.getContext("2d") || null;
      runDetector({
        setupRef,
        video,
        setCursor,
        setScribbleNewArea,
        dctx,
        pctx,
        setMessage
      }).then((stopDetectorCallback) => {
        if (stopDetectorCallback) {
          setStopDetector(() => stopDetectorCallback);
        }
      });
    }
    setIsLoaded(true);
  };

  const clearPaths = () => {
    setScribble([]);
    setScribbleNewArea([]);
    clearCanvases();
  };

  const { width, height } = inputResolution;

  if (!isSetupLoaded) {
    return null;
  }

  return (
    <div
      className={`wrap wrap--main wrap--${
        isStarted && isLoaded ? "started" : "not-started"
      } theme theme-${setup.theme}`}
      style={{ width, height }}
    >
      {isStarted ? (
        <>
          <svg
            className="bg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${width} ${height}`}
            style={{ width, height }}
          >
            <rect
              width={width}
              height={height}
              fill={setup.bg as string}
            ></rect>
          </svg>
          <Webcam
            audio={false}
            ref={webcamRef}
            width={width}
            height={height}
            style={{
              opacity: setup.videoOpacity
                ? (setup.videoOpacity as number) / 255
                : 1,
              position: "absolute"
            }}
            videoConstraints={inputResolution}
            forceScreenshotSourceSize={true}
            onLoadedData={handleVideoLoad}
            mirrored={true}
            imageSmoothing={false}
          />
          <canvas
            className={`canvas preview-canvas ${
              setup.pattern !== "canvas" ? "hidden" : ""
            }`}
            ref={previewCanvasRef}
            width={width}
            height={height}
          ></canvas>
          <canvas
            className={`canvas drawing-canvas ${
              setup.pattern !== "canvas" ? "hidden" : ""
            }`}
            ref={drawingCanvasRef}
            width={width}
            height={height}
          ></canvas>
          {setup.pattern !== "canvas" && (
            <Drawing
              {...{
                inputResolution,
                setup,
                cursor,
                scribble,
                scribbleNewArea
              }}
            />
          )}
          <button
            className="splash-button video-button pause-button"
            onClick={handlePlayButtonClick}
          >
            Stop camera
          </button>
          {setup.hasCursor && !setup.isScratchCanvas && (
            <Cursor
              cursor={cursor}
              hasCursor={setup.hasCursor}
              isScratchCanvas={setup.isScratchCanvas}
            />
          )}
        </>
      ) : (
        <Splash {...{ handlePlayButtonClick }} />
      )}
      {isSetupLoaded && (
        <Menu
          {...{
            setup,
            handleInputChange,
            setSetup,
            clearPaths
          }}
        />
      )}
      {message && <Message {...{ message, setMessage }} />}
      {/* <pre>{JSON.stringify(setup, null, 4)}</pre> */}
    </div>
  );
};

export default App;