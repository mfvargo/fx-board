export const min = -60;
export const max = -12;
export const maxWidth = 150;

interface Props {
  level: number;
}
export const signalToColor = ({ level }: Props) => {
  const width = ((level - min) * maxWidth) / (max - min);

  let color = "#777"; // grey
  if (width / maxWidth > 0.9) {
    color = "#ff4500"; // Orange Red
  } else if (width / maxWidth > 0.8) {
    color = "#fe5a1d"; // Giants Orange
  } else if (width / maxWidth > 0.5) {
    color = "#f0e130"; // Dandelion
  } else if (width / maxWidth > 0.25) {
    color = "#32cd32"; // Lime Green
  } else if (width / maxWidth > 0.1) {
    color = "#a8e4a0"; // Granny Smith
  }
  return color;
};
