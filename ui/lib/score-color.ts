/** Color the neural score gauge based on its value vs threshold. */
export function scoreColor(score: number, threshold: number = 72): string {
  if (score >= threshold) return '#10b981'; // emerald-500 — pass
  if (score >= threshold - 20) return '#f59e0b'; // amber-500 — close
  return '#ef4444'; // rose-500 — far
}
