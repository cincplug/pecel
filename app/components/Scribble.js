import React from "react";
import pathStrokes from "./patterns/path-strokes";
import { processColor } from "../utils";
import Hose from "./patterns/Hose";
import Kite from "./patterns/Kite";

const Scribble = ({ scribble, scribbleNewArea, setup }) => {
  const {
    pattern,
    color,
    opacity,
    pathStroke,
    speed,
    text,
    radius,
    minimum,
    dash
  } = setup;

  if (pattern === "hose") {
    return (
      <Hose
        scribble={scribble}
        scribbleNewArea={scribbleNewArea}
        setup={setup}
        radius={radius}
      />
    );
  }
  if (pattern === "kite") {
    return (
      <Kite
        scribble={scribble}
        scribbleNewArea={scribbleNewArea}
        setup={setup}
        radius={radius}
      />
    );
  }
  return (
    <>
      {[...scribble, scribbleNewArea].map((scribbleArea, scribbleAreaIndex) => {
        const area = scribbleArea.flat().reverse();
        const pathData =
          area
            .map((point, index) => {
              const lastPoint = area[area.length - 1] || point;
              const prevPoint = area[Math.max(0, index - 1)] || point;
              const nextPoint = area[Math.min(index + 1, area.length - 1)];
              if (!point || !lastPoint) return null;
              if (radius > 0 && lastPoint && index > 0) {
                const deltaX = point.x - lastPoint.x;
                const deltaY = point.y - lastPoint.y;
                const h = Math.hypot(deltaX, deltaY) + radius;
                const controlPoint = {
                  x: lastPoint.x + deltaX / 2 + deltaY / h,
                  y: lastPoint.y + deltaY / 2 - (radius * deltaX) / h
                };
                return pathStrokes({
                  pathStroke: pathStroke,
                  thisPoint: point,
                  prevPoint,
                  nextPoint,
                  controlPoint,
                  radius,
                  minimum
                });
              } else {
                return `${index === 0 ? "M" : "L"} ${point.x},${point.y}`;
              }
            })
            .join(" ") + (setup.isAutoClosed && area.length > 0 ? " Z" : "");
        return (
          <React.Fragment key={`scr-${scribbleAreaIndex}`}>
            <path
              id={`text-path-${scribbleAreaIndex}`}
              className="scribble"
              fill="none"
              stroke={processColor(color, opacity)}
              strokeWidth={radius}
              strokeDasharray={dash}
              d={pathData}
            ></path>
            {text && (
              <text
                fill={processColor(color, opacity)}
                fontSize={radius * 10}
                dominantBaseline="text-after-edge"
              >
                <textPath href={`#text-path-${scribbleAreaIndex}`}>
                  {speed > 0 && (
                    <animate
                      attributeName="startOffset"
                      to="0%"
                      from="100%"
                      dur={text.length / speed}
                      repeatCount="indefinite"
                    />
                  )}
                  {text}
                </textPath>
              </text>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default Scribble;
