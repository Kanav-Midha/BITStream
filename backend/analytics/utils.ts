export function parseDurationLabelToSeconds(value: string) {
  const parts = value
    .split(":")
    .map((chunk) => Number.parseInt(chunk, 10))
    .filter((chunk) => Number.isFinite(chunk));

  if (parts.length === 0) {
    return 0;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function clampPercentage(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

export function formatWatchTime(seconds: number) {
  if (seconds <= 0) {
    return "0m";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours <= 0) {
    return `${Math.max(1, minutes)}m`;
  }

  if (minutes <= 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatPercentage(value: number) {
  return `${Math.round(clampPercentage(value))}%`;
}
