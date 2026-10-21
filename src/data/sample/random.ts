export type Rng = () => number;

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function pick<T>(rng: Rng, values: readonly T[]): T {
  if (values.length === 0) throw new Error("cannot pick from an empty list");
  return values[Math.floor(rng() * values.length)] as T;
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function jitter(rng: Rng, spread: number): number {
  return (rng() * 2 - 1) * spread;
}

export function shuffle<T>(rng: Rng, values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
