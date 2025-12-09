import { describe, it, expect } from 'vitest'
import { generateId } from '../id'

describe('generateId', () => {
  it('文字列を返す', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('空文字列ではない', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(0)
  })

  it('毎回異なるIDを生成する', () => {
    const id1 = generateId()
    const id2 = generateId()
    const id3 = generateId()

    // 3つすべて異なる値であることを確認
    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })

  it('ULID形式である（26文字の英数字）', () => {
    const id = generateId()
    // ULIDは26文字の英数字（0-9, A-Z）
    expect(id).toMatch(/^[0-9A-Z]{26}$/)
  })

  it('複数回呼び出しても一意性が保たれる', () => {
    const ids = new Set<string>()
    const count = 100

    for (let i = 0; i < count; i++) {
      ids.add(generateId())
    }

    // すべて異なるIDが生成されることを確認
    expect(ids.size).toBe(count)
  })
})
