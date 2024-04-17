import {
  getDistance,
  checkElementPinch,
  squeezePoints,
  processColor,
  clearCanvases
} from "./index";
import { pinchCanvas } from "./pinchCanvas";
import { scratchCanvas } from "./scratchCanvas";

interface Point {
  x: number;
  y: number;
}

interface Cursor extends Point {
  isPinched: boolean;
  isWagging: boolean;
}

type Shape = number[][];

interface Shapes {
  lines: ShapeDefinition[];
  curves: ShapeDefinition[];
  arcs: ShapeDefinition[];
  ellipses: ShapeDefinition[];
  circles: ShapeDefinition[];
  squares: ShapeDefinition[];
  rhomboids: ShapeDefinition[];
  rectangles: ShapeDefinition[];
  triangles: ShapeDefinition[];
  diamonds: ShapeDefinition[];
}
interface ShapeDefinition {
  start: Point;
  end: Point;
  control?: Point;
}
interface ScratchPoints {
  [key: string]: Shape;
}

interface Setup {
  pattern: string;
  radius: number;
  color: string;
  opacity: number;
  minimum: number;
  pinchThreshold: number;
  usesButtonPinch: boolean;
  isScratchCanvas: boolean;
  scratchPoints: ScratchPoints;
  dash: number;
  pressedKey: string;
  dispersion: number;
  doesWagDelete: boolean;
  composite: GlobalCompositeOperation;
}

let lastX: number | undefined,
  lastY: number | undefined,
  lastTips: Point[] | undefined;

interface Keypoint {
  x: number;
  y: number;
  name: string;
}

interface Keypoint3D extends Keypoint {
  z: number;
}

interface Hand {
  score: number;
  handedness: "Left" | "Right";
  keypoints: Keypoint[];
  keypoints3D: Keypoint3D[];
}

export const processHands = ({
  setup,
  hands,
  setCursor,
  setScribbleNewArea,
  dctx,
  pctx
}: {
  setup: Setup;
  hands: Hand[];
  setCursor: React.Dispatch<React.SetStateAction<Cursor>>;
  setScribbleNewArea: React.Dispatch<React.SetStateAction<Point[]>>;
  dctx: CanvasRenderingContext2D | null;
  pctx: CanvasRenderingContext2D | null;
}) => {
  const {
    pattern,
    radius,
    color,
    opacity,
    minimum,
    pinchThreshold,
    usesButtonPinch,
    isScratchCanvas,
    scratchPoints,
    dash,
    pressedKey,
    dispersion,
    doesWagDelete,
    composite
  } = setup;
  if (dctx) {
    dctx.globalCompositeOperation = composite;
  }
  if (pctx) {
    pctx.clearRect(0, 0, pctx.canvas.width, pctx.canvas.height);
  }

  const shapeNames = [
    "lines",
    "squares",
    "rectangles",
    "rhomboids",
    "triangles",
    "diamonds",
    "circles",
    "curves",
    "arcs",
    "ellipses"
  ];

  hands.forEach((hand) => {
    const ctx = pressedKey === "Shift" || !isScratchCanvas ? dctx : pctx;
    if (ctx) {
      ctx.strokeStyle = processColor(color, opacity);
    }
    let newPoints: Point[] = [];
    if (!["paths"].includes(pattern)) {
      if (hand.keypoints) {
        newPoints = newPoints.concat(hand.keypoints);
      }
    }
    const wrist = hand.keypoints[0];
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    const middleTip = hand.keypoints[12];
    const dots = scratchPoints.dots.map(
      (point) => hand.keypoints[point as unknown as number]
    );
    const tips = squeezePoints({
      points: dots,
      squeezeRatio: pinchThreshold,
      centeringContext: dots
    });

    const shapes = shapeNames.reduce(
      (result: { [key: string]: any }, shapeName) => {
        result[shapeName] = scratchPoints[shapeName].map((shape) => {
          const points = shape.map((point) => hand.keypoints[point]);
          const squeezedPoints = squeezePoints({
            points,
            squeezeRatio: pinchThreshold,
            centeringContext: points
          });

          if (squeezedPoints) {
            type ShapeObject =
              | { start: Point; end: Point }
              | { start: Point; control: Point; end: Point };

            if (squeezedPoints[0] && squeezedPoints[1]) {
              let shapeObject: ShapeObject = {
                start: squeezedPoints[0],
                end: squeezedPoints[1]
              };
              if (
                (shapeName === "curves" || shapeName === "ellipses") &&
                squeezedPoints[2]
              ) {
                shapeObject = {
                  start: squeezedPoints[0],
                  control: squeezedPoints[1],
                  end: squeezedPoints[2]
                };
              }

              return shapeObject;
            }
          }
        });
        return result;
      },
      {}
    );

    const thumbIndexDistance = getDistance(thumbTip, indexTip);
    const isPinched =
      pressedKey === "Shift" || thumbIndexDistance < pinchThreshold;
    const isWagging =
      doesWagDelete &&
      (wrist.y - indexTip.y) / (wrist.y - middleTip.y) > 3 &&
      (wrist.y - indexTip.y) / (wrist.x - indexTip.x) > 3;
    const x = (thumbTip.x + indexTip.x) / 2;
    const y = (thumbTip.y + indexTip.y) / 2;
    setCursor((prevCursor: Cursor) => {
      const threshold = prevCursor.isPinched
        ? pinchThreshold * 2
        : pinchThreshold;
      if (usesButtonPinch && thumbIndexDistance < pinchThreshold * 4) {
        checkElementPinch({ x, y, isPinched });
      }
      const nextCursor: Cursor = {
        x,
        y,
        isWagging: isWagging,
        isPinched: thumbIndexDistance < threshold
      };
      return nextCursor;
    });

    if (pattern === "canvas" && ctx) {
      ctx.setLineDash(dash ? [dash, dash] : []);
      ctx.lineJoin = "round";
      if (isWagging) {
        clearCanvases();
        lastX = undefined;
        lastY = undefined;
        lastTips = undefined;
      }
      if (isScratchCanvas) {
        scratchCanvas({
          radius,
          minimum,
          ctx,
          tips: tips as Point[],
          lastTips: lastTips || [],
          dispersion,
          shapes: shapes as Shapes
        });
        lastTips = tips as Point[];
      } else {
        lastTips = undefined;
      }
      if (isPinched && !isScratchCanvas) {
        let result = pinchCanvas({
          radius,
          thumbIndexDistance,
          minimum,
          ctx,
          dispersion,
          x,
          y,
          lastX,
          lastY
        });
        lastX = result.lastX;
        lastY = result.lastY;
      } else {
        lastX = undefined;
        lastY = undefined;
      }
    } else if (isPinched) {
      setScribbleNewArea((prevScribbleNewArea: Point[]) => {
        const isNewArea =
          prevScribbleNewArea.length === 0 ||
          getDistance(prevScribbleNewArea[prevScribbleNewArea.length - 1], {
            x,
            y
          }) > minimum;
        if (isNewArea) {
          setScribbleNewArea([...prevScribbleNewArea, { x, y }]);
        } else {
          setScribbleNewArea(prevScribbleNewArea);
        }
        return prevScribbleNewArea;
      });
    }
  });
};