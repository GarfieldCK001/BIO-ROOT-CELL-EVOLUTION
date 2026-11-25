/**
 * Deterministic Seeded PRNG (Mulberry32) for reproducible runs, daily challenge layouts,
 * and deterministic headless simulation tests.
 */
export class SeededRng {
  private state: number;
  public readonly initialSeed: number;

  constructor(seed: number) {
    const normalized = normalizeSeed(seed);
    this.initialSeed = normalized;
    this.state = normalized;
  }

  /** Returns a float in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a float in [min, max). */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns an integer in [min, max] inclusive. */
  public int(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (hi <= lo) return lo;
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  /** Returns true with probability p in [0, 1]. */
  public chance(p: number): boolean {
    return this.next() < p;
  }
}

/**
 * Clamp/normalize any user or persisted seed into a positive 32-bit unsigned integer.
 */
export function normalizeSeed(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.floor(Math.abs(raw)) >>> 0;
    return n === 0 ? 0x9e3779b9 : n;
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    let hash = 2166136261;
    const str = raw.trim();
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const u = hash >>> 0;
    return u === 0 ? 0x9e3779b9 : u;
  }
  return ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) || 0x9e3779b9;
}

/**
 * Compute a deterministic YYYYMMDD integer seed for the Daily Challenge mode.
 */
export function getDailyChallengeSeed(date: Date = new Date()): number {
  const yyyy = date.getUTCFullYear();
  const mm = date.getUTCMonth() + 1;
  const dd = date.getUTCDate();
  return yyyy * 10000 + mm * 100 + dd;
}

/**
 * Format a numeric seed cleanly for HUD / menu display.
 */
export function formatSeedCode(seed: number): string {
  return `#${normalizeSeed(seed)}`;
}
