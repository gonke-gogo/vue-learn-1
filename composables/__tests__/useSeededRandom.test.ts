import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSeededRandom } from '../useSeededRandom'

describe('useSeededRandom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本的な動作', () => {
    it('同じsaltで同じ結果を返す（決定性）', () => {
      const salt = '100'
      const array = ['a', 'b', 'c', 'd', 'e']

      const random1 = useSeededRandom(salt)
      const random2 = useSeededRandom(salt)

      const result1 = random1.pick(array)
      const result2 = random2.pick(array)

      expect(result1).toBe(result2)
    })

    it('空配列でundefinedを返す', () => {
      const random = useSeededRandom('100')
      const result = random.pick([])
      expect(result).toBeUndefined()
    })

    it('数値のsaltを受け取れる', () => {
      const array = ['a', 'b', 'c']
      const random = useSeededRandom(123)
      const result = random.pick(array)
      expect(result).toBeDefined()
      expect(array).toContain(result)
    })

    it('文字列のsaltを受け取れる', () => {
      const array = ['a', 'b', 'c']
      const random = useSeededRandom('123')
      const result = random.pick(array)
      expect(result).toBeDefined()
      expect(array).toContain(result)
    })

    it('数値に変換できない文字列の場合は0として扱う', () => {
      const array = ['a', 'b', 'c']
      const random1 = useSeededRandom('invalid')
      const random2 = useSeededRandom(0)

      const result1 = random1.pick(array)
      const result2 = random2.pick(array)

      expect(result1).toBe(result2)
    })

    it('配列のインデックスが正しく計算される', () => {
      const array = ['a', 'b', 'c', 'd', 'e']
      // salt = 7, array.length = 5 → 7 % 5 = 2 → array[2] = 'c'
      const random = useSeededRandom(7)
      const result = random.pick(array)
      expect(result).toBe('c')
    })

    it('大きなsalt値でも正しく動作する', () => {
      const array = ['a', 'b', 'c']
      // salt = 1000, array.length = 3 → 1000 % 3 = 1 → array[1] = 'b'
      const random = useSeededRandom(1000)
      const result = random.pick(array)
      expect(result).toBe('b')
    })
  })

  describe('mock/spyを使ったテスト', () => {
    it('parseIntが呼ばれることを確認（spy）', () => {
      const parseIntSpy = vi.spyOn(global, 'parseInt')

      useSeededRandom('123')

      expect(parseIntSpy).toHaveBeenCalledTimes(1)
      expect(parseIntSpy).toHaveBeenCalledWith('123', 10)
      parseIntSpy.mockRestore()
    })

    it('文字列のsaltでparseIntが呼ばれることを確認（spy）', () => {
      const parseIntSpy = vi.spyOn(global, 'parseInt')

      const random = useSeededRandom('456')
      random.pick(['a', 'b', 'c'])

      expect(parseIntSpy).toHaveBeenCalledWith('456', 10)
      parseIntSpy.mockRestore()
    })
  })
})
