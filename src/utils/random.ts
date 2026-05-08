export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
