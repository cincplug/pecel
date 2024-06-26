import { getPoint } from "../../utils";
import { IShape } from "../../../types";

interface LineProps {
  shape: IShape;
  title: string;
  onClick: () => void;
  isPreview?: boolean;
}

const Line: React.FC<LineProps> = ({
  shape: { startPoint, endPoint },
  title,
  onClick,
  isPreview = false
}) => {
  const { x: spx, y: spy } = getPoint(startPoint, isPreview);
  const { x: epx, y: epy } = getPoint(endPoint, isPreview);

  return (
    <line
      x1={spx}
      y1={spy}
      x2={epx}
      y2={epy}
      className="scratch-path"
      onClick={onClick}
    >
      <title>{title}</title>
    </line>
  );
};

export default Line;
