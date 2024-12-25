import { Level } from "../../utils/UnitModel";
import { min, max, maxWidth, signalToColor } from "../../utils/setSignalToColor";

type RemString = `${number}rem`;

interface LevelMeterProps {
  signal: Level;
  orientation: "horizontal" | "vertical";
  size?: number | RemString;
}

export default function LevelMeter({ signal, orientation, size }: LevelMeterProps) {
  let { peak, level } = signal;
  // if size is a rem string, convert the value into px (1rem = 16px)
  // @ts-ignore
  const sizeNum = typeof size === "number" ? size : parseFloat(size) * 16;
  // use size if provided, otherwise use default width value
  const meterSize = sizeNum || maxWidth;

  // calculate dimensions based on orientation
  const fullSvgHeight = orientation === "horizontal" ? 20 : meterSize;
  const fullSvgWidth = orientation === "horizontal" ? meterSize : 20;
  const fillHeight = orientation === "horizontal" ? 20 : ((level - min) * meterSize) / (max - min);
  const fillWidth = orientation === "horizontal" ? ((level - min) * meterSize) / (max - min) : 20;
  const fillPosition = orientation === "horizontal" ? 0 : meterSize - fillHeight;
  const peakHeight = orientation === "horizontal" ? 20 : 5;
  const peakWidth = orientation === "horizontal" ? 5 : 20;
  const peakYPosition = orientation === "horizontal" ? 0 : meterSize - ((peak - min) * meterSize) / (max - min);
  const peakXPosition = orientation === "horizontal" ? ((peak - min) * meterSize) / (max - min) : 0;

  let overload = false;

  if (peak > max) {
    overload = true;
    peak = max;
  }
  if (peak < min) {
    peak = min;
  }
  if (level > max) {
    level = max;
  }
  if (level < min) {
    level = min;
  }

  return (
    <svg style={{ height: fullSvgHeight, width: fullSvgWidth }}>
      <rect style={{ height: fullSvgHeight, width: fullSvgWidth }} fill="#ccc" rx="0" ry="0" />
      <rect
        style={{ height: fillHeight, width: fillWidth }}
        y={fillPosition}
        fill={signalToColor(signal)}
        rx="0"
        ry="0"
      />
      <rect
        style={{ height: peakHeight, width: peakWidth }}
        x={peakXPosition}
        y={peakYPosition}
        fill={overload ? "#FF0000" : "#000000"}
        rx="0"
        ry="0"
      />
    </svg>
  );
}
