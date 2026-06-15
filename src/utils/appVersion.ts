/**
 * Compare semantic versions (e.g. 1.2.4 vs 1.2.5).
 * Returns true when current is strictly lower than minimum.
 */
export function isVersionLower(current: string, minimum: string): boolean {
  const normalize = (version: string) =>
    version
      .trim()
      .split('.')
      .map(part => parseInt(part.replace(/[^0-9].*$/, ''), 10) || 0);

  const currentParts = normalize(current);
  const minimumParts = normalize(minimum);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let i = 0; i < length; i += 1) {
    const currentPart = currentParts[i] ?? 0;
    const minimumPart = minimumParts[i] ?? 0;

    if (currentPart < minimumPart) {
      return true;
    }
    if (currentPart > minimumPart) {
      return false;
    }
  }

  return false;
}
