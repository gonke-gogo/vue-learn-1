/**
 * シード値から決定性のある疑似乱数生成器を提供
 * mulberry32アルゴリズムを使用
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  /**
   * 0以上1未満の乱数を生成
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * 0以上max未満の整数を生成
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}

/**
 * 文字列を32bit整数に変換（FNV-1aハッシュ）
 */
function stringToSeed(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

/**
 * date, mood, saltからシード値を生成
 */
function generateSeed(date: string, mood: number, salt?: string): number {
  const seedStr = `${date}-${mood}${salt ? `-${salt}` : ''}`
  return stringToSeed(seedStr)
}

export function useSeededRandom(date: string, mood: number, salt?: string) {
  const seed = generateSeed(date, mood, salt)
  const rng = new SeededRandom(seed)

  /**
   * 配列から1つの要素をランダムに選択
   */
  function pick<T>(array: T[]): T | undefined {
    if (array.length === 0) {
      return undefined
    }
    const index = rng.nextInt(array.length)
    return array[index]
  }

  /**
   * 次の乱数を取得（イテレータ的）
   */
  function next(): number {
    return rng.next()
  }

  return {
    pick,
    next,
    seed,
  }
}

