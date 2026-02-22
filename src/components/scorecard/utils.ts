// Utility functions for scorecard

const VOLUME_PATTERN = /^([\d.]+)([KMB])?$/;

export function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return String(value);
}

export function parseVolumeInput(input: string): number | null {
  const cleaned = input.trim().toUpperCase();
  const match = cleaned.match(VOLUME_PATTERN);
  if (!match) {
    return null;
  }

  const num = Number.parseFloat(match[1]);
  if (Number.isNaN(num)) {
    return null;
  }

  const multiplier = match[2];
  if (multiplier === "K") {
    return Math.round(num * 1e3);
  }
  if (multiplier === "M") {
    return Math.round(num * 1e6);
  }
  if (multiplier === "B") {
    return Math.round(num * 1e9);
  }
  return Math.round(num);
}
