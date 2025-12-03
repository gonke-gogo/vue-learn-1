import { describe, it, expect } from 'vitest'
import { useSeededRandom } from '../useSeededRandom'

describe('useSeededRandom', () => {
  it('同じシードで同じ結果を返す（決定性）', () => {
    const date = '2024-01-01'
    const mood = 3
    const array = ['a', 'b', 'c', 'd', 'e']

    const random1 = useSeededRandom(date, mood)
    const random2 = useSeededRandom(date, mood)

    const result1 = random1.pick(array)
    const result2 = random2.pick(array)

    expect(result1).toBe(result2)
  })

  it('異なるシードで異なる結果を返す可能性がある', () => {
    const array = ['a', 'b', 'c', 'd', 'e']

    const random1 = useSeededRandom('2024-01-01', 1)
    const random2 = useSeededRandom('2024-01-01', 2)

    const _result1 = random1.pick(array)
    const _result2 = random2.pick(array)

    // 異なるmoodで異なる結果になる可能性が高い（確率的に）
    // ただし、偶然同じになる可能性もあるため、複数回試行
    let allSame = true
    for (let i = 0; i < 10; i++) {
      const r1 = useSeededRandom('2024-01-01', 1, i.toString())
      const r2 = useSeededRandom('2024-01-01', 2, i.toString())
      if (r1.pick(array) !== r2.pick(array)) {
        allSame = false
        break
      }
    }
    expect(allSame).toBe(false)
  })

  it('saltパラメータが結果に影響する', () => {
    const date = '2024-01-01'
    const mood = 3
    const array = ['a', 'b', 'c', 'd', 'e']

    const random1 = useSeededRandom(date, mood, 'salt1')
    const random2 = useSeededRandom(date, mood, 'salt2')

    const result1 = random1.pick(array)
    const result2 = random2.pick(array)

    expect(result1).not.toBe(result2)
  })

  it('空配列でundefinedを返す', () => {
    const random = useSeededRandom('2024-01-01', 1)
    const result = random.pick([])
    expect(result).toBeUndefined()
  })

  it('next()で0以上1未満の値を返す', () => {
    const random = useSeededRandom('2024-01-01', 1)
    for (let i = 0; i < 100; i++) {
      const value = random.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('同じシードでnext()が同じシーケンスを返す', () => {
    const random1 = useSeededRandom('2024-01-01', 1)
    const random2 = useSeededRandom('2024-01-01', 1)

    for (let i = 0; i < 10; i++) {
      expect(random1.next()).toBe(random2.next())
    }
  })
})
