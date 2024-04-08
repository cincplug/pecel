import React, { useState } from "react";
import Dots from "./Dots";
import Lines from "./Lines";
import Arcs from "./Arcs";
import Curves from "./Curves";
import Preview from "./Preview";
import { arraysHaveSameElements } from "../../utils";

function Scratch({ setup, handleInputChange }) {
  const [activeLayer, setActiveLayer] = useState("dots");
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [controlPoint, setControlPoint] = useState(null);
  const { scratchPoints } = setup;

  const handleDotClick = (index) => {
    if (activeLayer === "dots") {
      toggleDot(index);
    } else {
      if (!startPoint) {
        setStartPoint(index);
      } else if (
        (activeLayer === "curves" || activeLayer === "arcs") &&
        controlPoint === null
      ) {
        setControlPoint(index);
      } else {
        handlePathClick({
          start: startPoint,
          control: controlPoint,
          end: index,
          type: activeLayer
        });
        setStartPoint(null);
        setControlPoint(null);
      }
    }
  };

  const toggleDot = (index) => {
    const newScratchPoints = { ...scratchPoints };
    newScratchPoints[activeLayer] = newScratchPoints[activeLayer].includes(
      index
    )
      ? newScratchPoints[activeLayer].filter((point) => point !== index)
      : [...newScratchPoints[activeLayer], index];

    handleInputChange({
      target: {
        id: "scratchPoints",
        value: newScratchPoints,
        type: "hidden"
      }
    });
  };

  const handlePathClick = ({ start, control, end, type }) => {
    const newScratchPoints = { ...scratchPoints };
    const path =
      type === "lines"
        ? [start, end].sort((a, b) => a - b)
        : [start, control, end];
    const existingPathIndex = newScratchPoints[type].findIndex(
      (existingPath) =>
        arraysHaveSameElements(existingPath, path)
    );

    const addNewPath = () => {
      newScratchPoints[type] = [...newScratchPoints[type], path];
    };

    const removePath = () => {
      newScratchPoints[type] = [
        ...newScratchPoints[type].slice(0, existingPathIndex),
        ...newScratchPoints[type].slice(existingPathIndex + 1)
      ];
    };

    const isNewPath = existingPathIndex === -1;
    isNewPath ? addNewPath() : removePath();

    handleInputChange({
      target: {
        id: "scratchPoints",
        value: newScratchPoints,
        type: "hidden"
      }
    });
  };

  const handleMouseMove = (event) => {
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const { x, y } = point.matrixTransform(svg.getScreenCTM().inverse());
    setEndPoint({ x, y });
  };

  return (
    <div
      className={`scratch-wrap active-${
        activeLayer === "dots" ? "dots" : "paths"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 460 500"
        className="scratch-svg"
        onMouseMove={handleMouseMove}
      >
        <Arcs
          {...{
            handlePathClick,
            startPoint,
            endPoint,
            controlPoint,
            setControlPoint
          }}
          selectedArcs={scratchPoints.arcs}
        />
        <Curves
          {...{
            handlePathClick,
            startPoint,
            endPoint,
            controlPoint,
            setControlPoint
          }}
          selectedCurves={scratchPoints.curves}
        />
        <Lines
          {...{ handlePathClick, startPoint, endPoint }}
          selectedLines={scratchPoints.lines}
        />
        {startPoint && (
          <Preview {...{ startPoint, endPoint, controlPoint, activeLayer }} />
        )}
        <g className={`scratch-layer dots`}>
          <Dots
            selectedDots={scratchPoints.dots}
            handleDotClick={handleDotClick}
          />
        </g>
      </svg>
      {["dots", "lines", "curves", "arcs"].map((layer, index) => (
        <button
          className={`scratch-layer-button ${
            layer === activeLayer ? "active" : ""
          }`}
          key={index}
          onClick={() => setActiveLayer(layer)}
        >
          {layer}
        </button>
      ))}
    </div>
  );
}

export default Scratch;
