/**
 * シード値から決定性のある疑似乱数生成器を提供
 * 同じシード値からは常に同じ乱数列が生成される
 * mulberry32アルゴリズムを使用（高速で品質の良い乱数生成）
 */
class SeededRandom {
  // 現在のシード値（内部状態）
  // この値が更新されることで、毎回異なる乱数が生成される
  private seed: number

  /**
   * コンストラクタ：初期シード値を設定
   * @param seed - 乱数生成の元になる数値（同じ値なら同じ乱数列が生成される）
   */
  constructor(seed: number) {
    this.seed = seed
  }

  /**
   * 0以上1未満の小数の乱数を生成
   * 例: 0.123456789, 0.987654321
   *
   * mulberry32アルゴリズムの処理：
   * 1. シードに定数を加算（0x6d2b79f5はマジックナンバー）
   * 2. ビット演算でシードを混ぜ合わせる（XOR、シフト、乗算）
   * 3. 結果を0-1の範囲に正規化（4294967296 = 2^32）
   *
   * @returns 0以上1未満の小数
   */
  next(): number {
    // シードに定数を加算して更新（これにより毎回異なる値になる）
    let t = (this.seed += 0x6d2b79f5)

    // ビット演算で値を混ぜ合わせる（XOR演算とビットシフト）
    // t >>> 15: 15ビット右シフト（符号なし）
    // t | 1: 最下位ビットを1に設定（奇数にする）
    // Math.imul: 32bit整数の乗算（オーバーフローを防ぐ）
    t = Math.imul(t ^ (t >>> 15), t | 1)

    // さらに混ぜ合わせる
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    // 結果を0-1の範囲に正規化
    // >>> 0: 符号なし32bit整数に変換
    // 4294967296 = 2^32（32bit整数の最大値+1）
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * 0以上max未満の整数の乱数を生成
   * 例: nextInt(10) → 0, 1, 2, ..., 9のいずれか
   *
   * @param max - 生成する乱数の上限（この値は含まれない）
   * @returns 0以上max未満の整数
   */
  nextInt(max: number): number {
    // next()で0-1の小数を生成し、max倍して整数に変換
    // Math.floorで切り捨てることで、0以上max未満の整数になる
    return Math.floor(this.next() * max)
  }
}

/**
 * 文字列を32bit整数（シード値）に変換
 * FNV-1aハッシュアルゴリズムを使用
 *
 * 同じ文字列は常に同じ数値に変換される
 * 例: "2024-01-15" → 1234567890（常に同じ値）
 *
 * @param str - 変換する文字列（例: "2024-01-15-100"）
 * @returns 32bit整数（符号なし）
 */
function stringToSeed(str: string): number {
  // FNV-1aハッシュの初期値（offset basis）
  // 2166136261は32bit版のFNV-1aで使われる定数
  let hash = 2166136261

  // 文字列の各文字を処理
  for (let i = 0; i < str.length; i++) {
    // XOR演算：現在のハッシュ値と文字コードをXOR
    // これにより文字の順序が重要になる
    hash ^= str.charCodeAt(i)

    // ビットシフトと加算でハッシュを更新
    // hash << 1: 1ビット左シフト（2倍）
    // hash << 4: 4ビット左シフト（16倍）
    // hash << 7: 7ビット左シフト（128倍）
    // hash << 8: 8ビット左シフト（256倍）
    // hash << 24: 24ビット左シフト（16777216倍）
    // これらを足し合わせることで、良い分散性を持つハッシュ値が生成される
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  // 符号なし32bit整数に変換（負の数を0以上に変換）
  // >>> 0: 符号なし右シフト0ビット（実質的に符号なし変換）
  return hash >>> 0
}

/**
 * date（日付）とsalt（塩）からシード値を生成
 *
 * 例:
 * - generateSeed("2024-01-15", "100") → "2024-01-15-100" → シード値
 * - generateSeed("2024-01-15", "101") → "2024-01-15-101" → 異なるシード値
 * - generateSeed("2024-01-15") → "2024-01-15" → シード値
 *
 * saltを変えることで、同じ日付でも異なる乱数列を生成できる
 *
 * @param date - 日付文字列（例: "2024-01-15"）
 * @param salt - オプションの塩（ランダム性を追加する値、例: "1234"）
 * @returns シード値（32bit整数）
 */
function generateSeed(date: string, salt?: string): number {
  // dateとsaltを結合して文字列を作成
  // saltがある場合は "-" で区切る
  // 例: "2024-01-15" + "-" + "100" = "2024-01-15-100"
  const seedStr = `${date}${salt ? `-${salt}` : ''}`

  // 文字列をシード値（数値）に変換
  return stringToSeed(seedStr)
}

/**
 * 日付とsaltから決定性のある疑似乱数生成器を作成
 *
 * 使用例:
 * ```typescript
 * const random = useSeededRandom("2024-01-15", "100")
 * const quote = random.pick(quotes)  // 名言をランダムに選ぶ
 * const num = random.next()         // 0-1の乱数を取得
 * ```
 *
 * 同じdateとsaltなら、常に同じ結果が返される
 * saltを変えると、異なる結果が返される
 *
 * @param date - 日付文字列（例: "2024-01-15"）
 * @param salt - オプションの塩（ランダム性を追加する値、例: "1234"）
 * @returns 乱数生成器オブジェクト（pick, next, seed）
 */
export function useSeededRandom(date: string, salt?: string) {
  // dateとsaltからシード値を生成
  // 例: "2024-01-15" + "100" → "2024-01-15-100" → シード値
  const seed = generateSeed(date, salt)

  // シード値から乱数生成器を作成
  // この乱数生成器は、同じシードなら同じ乱数列を生成する
  const rng = new SeededRandom(seed)

  /**
   * 配列から1つの要素をランダムに選択
   *
   * 使用例:
   * ```typescript
   * const quotes = ["名言1", "名言2", "名言3"]
   * const picked = random.pick(quotes)  // "名言1", "名言2", "名言3"のいずれか
   * ```
   *
   * 同じシードなら、同じ配列からは常に同じ要素が選ばれる
   *
   * @param array - 選択元の配列（読み取り専用）
   * @returns 選ばれた要素、配列が空の場合はundefined
   */
  function pick<T>(array: readonly T[]): T | undefined {
    // 配列が空の場合はundefinedを返す
    if (array.length === 0) {
      return undefined
    }

    // 0以上array.length未満の整数を生成
    // 例: array.length = 10 の場合、0-9のいずれか
    const index = rng.nextInt(array.length)

    // 生成したインデックスで配列から要素を取得
    return array[index]
  }

  /**
   * 次の乱数を取得（0以上1未満の小数）
   *
   * 使用例:
   * ```typescript
   * const num = random.next()  // 例: 0.123456789
   * ```
   *
   * 同じシードなら、呼び出すたびに異なる値が返される
   * （ただし、シードが同じなら呼び出し順序が同じなら同じ値が返される）
   *
   * @returns 0以上1未満の小数
   */
  function next(): number {
    return rng.next()
  }

  // 外部に公開する関数と値を返す
  return {
    pick, // 配列から要素を選ぶ関数
    next, // 次の乱数を取得する関数
    seed, // 現在のシード値（デバッグ用）
  }
}
