/**
 * saltの値から配列のインデックスを決定して要素を選ぶ
 *
 * シンプルな実装：saltの値を配列の長さで割った余りをインデックスとして使う
 *
 * 使用例:
 * ```typescript
 * const random = useSeededRandom("100")
 * const quote = random.pick(quotes)  // 名言を選ぶ
 * ```
 *
 * 同じsaltなら、同じ配列からは常に同じ要素が選ばれる
 * saltを変えると、異なる要素が選ばれる
 *
 * @param salt - インデックス決定に使う値（文字列または数値）
 * @returns 要素選択関数（pick）
 */
export function useSeededRandom(salt: string | number) {
  // saltを数値に変換
  const saltValue = typeof salt === 'string' ? parseInt(salt, 10) || 0 : salt

  /**
   * 配列から1つの要素を選択
   *
   * saltの値を配列の長さで割った余りをインデックスとして使う
   * 例: salt = 1234, array.length = 10 → 1234 % 10 = 4 → array[4]
   *
   * 使用例:
   * ```typescript
   * const quotes = ["名言1", "名言2", "名言3"]
   * const picked = random.pick(quotes)  // saltの値に応じて選ばれる
   * ```
   *
   * @param array - 選択元の配列（読み取り専用）
   * @returns 選ばれた要素、配列が空の場合はundefined
   */
  function pick<T>(array: readonly T[]): T | undefined {
    // 配列が空の場合はundefinedを返す
    if (array.length === 0) {
      return undefined
    }

    // saltの値を配列の長さで割った余りをインデックスとして使う
    // 例: salt = 1234, array.length = 10 → 1234 % 10 = 4
    const index = saltValue % array.length

    // 計算したインデックスで配列から要素を取得
    return array[index]
  }

  // 外部に公開する関数を返す
  return {
    pick, // 配列から要素を選ぶ関数
  }
}
