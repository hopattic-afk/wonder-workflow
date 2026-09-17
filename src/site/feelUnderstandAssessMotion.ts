export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export function range(p: number, a: number, b: number) {
  return clamp((p - a) / (b - a), 0, 1);
}

export function chapterProgress(
  rectTop: number,
  chapterHeight: number,
  viewportHeight: number,
) {
  const total = chapterHeight - viewportHeight;
  const scrolled = clamp(-rectTop, 0, total);
  return total > 0 ? scrolled / total : 0;
}

export function beatOpacities(p: number) {
  const feelHold = 1 - smooth(range(p, 0.28, 0.4));
  const undIn = smooth(range(p, 0.32, 0.42));
  const undHold = 1 - smooth(range(p, 0.58, 0.68));
  const assIn = smooth(range(p, 0.62, 0.74));
  return {
    feel: feelHold,
    understand: undIn * undHold,
    assess: assIn,
  };
}

export function feelTension(p: number) {
  return (
    smooth(range(p, 0.05, 0.22)) * (1 - smooth(range(p, 0.26, 0.38)))
  );
}

export function assessGlowFromProgress(p: number, reducedMotion: boolean) {
  return reducedMotion || p > 0.66;
}
