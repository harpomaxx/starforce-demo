export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function now() {
  return performance.now();
}

export function rectsCollide(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

