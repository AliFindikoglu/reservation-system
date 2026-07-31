export function getSeatLabel(tableNumber) {
  const letters = ["A", "B", "C", "D"];

  const block = Math.floor((tableNumber - 1) / 8);
  const index = ((tableNumber - 1) % 8) + 1;

  return `${letters[block]}${index}`;
}