export function gini(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return 0;
  }

  let weightedSum = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    weightedSum += (index + 1) * sorted[index];
  }

  return (2 * weightedSum) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}
