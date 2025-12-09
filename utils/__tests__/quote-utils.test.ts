import { describe, it, expect } from 'vitest'
import { searchQuotes, filterByTags, sortQuotes } from '../quote-utils'
import type { Quote } from '@/types/quote'

// テスト用のモックデータ
let mockIdCounter = 1
const createMockQuote = (
  text: string,
  author?: string,
  tags?: string[],
  createdAt: string = '2024-01-01T00:00:00Z'
): Quote => ({
  id: `mock-${mockIdCounter++}`,
  text,
  author,
  tags,
  createdAt,
  updatedAt: createdAt,
})

describe('quote-utils', () => {
  describe('searchQuotes', () => {
    const quotes: Quote[] = [
      createMockQuote('今日は良い天気です', 'テスト著者', ['天気', '日常']),
      createMockQuote('プログラミングは楽しい', '開発者', ['プログラミング', '技術']),
      createMockQuote('健康が一番', undefined, ['健康', '生活']),
    ]

    it('空のクエリで全件を返す', () => {
      const result = searchQuotes(quotes, '')
      expect(result).toHaveLength(3)
      expect(result).toEqual(quotes)
    })

    it('空白のみのクエリで全件を返す', () => {
      const result = searchQuotes(quotes, '   ')
      expect(result).toHaveLength(3)
      expect(result).toEqual(quotes)
    })

    it('テキストで検索できる', () => {
      const result = searchQuotes(quotes, '天気')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('今日は良い天気です')
    })

    it('著者名で検索できる', () => {
      const result = searchQuotes(quotes, 'テスト')
      expect(result).toHaveLength(1)
      expect(result[0].author).toBe('テスト著者')
    })

    it('タグで検索できる', () => {
      const result = searchQuotes(quotes, 'プログラミング')
      expect(result).toHaveLength(1)
      expect(result[0].tags).toContain('プログラミング')
    })

    it('大文字小文字を区別しない', () => {
      const englishQuotes: Quote[] = [
        createMockQuote('Hello World', 'Author', ['Tag']),
        createMockQuote('hello world', 'author', ['tag']),
      ]
      const result1 = searchQuotes(englishQuotes, 'Hello')
      const result2 = searchQuotes(englishQuotes, 'hello')
      expect(result1).toEqual(result2)
      expect(result1).toHaveLength(2)
    })

    it('部分一致で検索できる', () => {
      const result = searchQuotes(quotes, '良い')
      expect(result).toHaveLength(1)
      expect(result[0].text).toContain('良い')
    })

    it('複数の条件に一致する場合は複数件返す', () => {
      const moreQuotes: Quote[] = [
        ...quotes,
        createMockQuote('天気が良い日は散歩', 'テスト著者', ['天気']),
      ]
      const result = searchQuotes(moreQuotes, '天気')
      expect(result.length).toBeGreaterThan(1)
    })

    it('一致しない場合は空配列を返す', () => {
      const result = searchQuotes(quotes, '存在しないテキスト')
      expect(result).toHaveLength(0)
    })

    it('著者がundefinedでもエラーにならない', () => {
      const result = searchQuotes(quotes, '健康')
      expect(result).toHaveLength(1)
      expect(result[0].author).toBeUndefined()
    })

    it('タグがundefinedでもエラーにならない', () => {
      const quotesWithoutTags: Quote[] = [createMockQuote('テスト', '著者')]
      const result = searchQuotes(quotesWithoutTags, 'テスト')
      expect(result).toHaveLength(1)
    })
  })

  describe('filterByTags', () => {
    const quotes: Quote[] = [
      createMockQuote('名言1', '著者1', ['タグ1', 'タグ2']),
      createMockQuote('名言2', '著者2', ['タグ2', 'タグ3']),
      createMockQuote('名言3', '著者3', ['タグ3']),
      createMockQuote('名言4', '著者4'), // タグなし
    ]

    it('空のタグ配列で全件を返す', () => {
      const result = filterByTags(quotes, [])
      expect(result).toHaveLength(4)
      expect(result).toEqual(quotes)
    })

    it('単一のタグでフィルタリングできる', () => {
      const result = filterByTags(quotes, ['タグ1'])
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('名言1')
    })

    it('複数のタグでフィルタリングできる（OR条件）', () => {
      const result = filterByTags(quotes, ['タグ1', 'タグ3'])
      expect(result).toHaveLength(3) // タグ1が1件、タグ3が2件
    })

    it('複数のタグに一致する名言が1回だけ返される', () => {
      const result = filterByTags(quotes, ['タグ2'])
      expect(result).toHaveLength(2) // 名言1と名言2
    })

    it('存在しないタグで空配列を返す', () => {
      const result = filterByTags(quotes, ['存在しないタグ'])
      expect(result).toHaveLength(0)
    })

    it('タグがundefinedの名言は除外される', () => {
      const result = filterByTags(quotes, ['タグ1'])
      expect(result.every((q) => q.tags && q.tags.length > 0)).toBe(true)
    })

    it('元の配列を変更しない（イミュータブル）', () => {
      const originalLength = quotes.length
      filterByTags(quotes, ['タグ1'])
      expect(quotes).toHaveLength(originalLength)
    })
  })

  describe('sortQuotes', () => {
    const quotes: Quote[] = [
      createMockQuote('古い名言', '著者1', [], '2024-01-01T00:00:00Z'),
      createMockQuote('新しい名言', '著者2', [], '2024-01-03T00:00:00Z'),
      createMockQuote('中間の名言', '著者3', [], '2024-01-02T00:00:00Z'),
    ]

    it('デフォルトで降順（新しい順）にソートされる', () => {
      const result = sortQuotes(quotes)
      expect(result[0].text).toBe('新しい名言')
      expect(result[1].text).toBe('中間の名言')
      expect(result[2].text).toBe('古い名言')
    })

    it('descで降順（新しい順）にソートされる', () => {
      const result = sortQuotes(quotes, 'desc')
      expect(result[0].text).toBe('新しい名言')
      expect(result[result.length - 1].text).toBe('古い名言')
    })

    it('ascで昇順（古い順）にソートされる', () => {
      const result = sortQuotes(quotes, 'asc')
      expect(result[0].text).toBe('古い名言')
      expect(result[1].text).toBe('中間の名言')
      expect(result[2].text).toBe('新しい名言')
    })

    it('元の配列を変更しない（イミュータブル）', () => {
      const originalOrder = quotes.map((q) => q.text)
      sortQuotes(quotes)
      expect(quotes.map((q) => q.text)).toEqual(originalOrder)
    })

    it('同じ日付の場合は順序が保持される', () => {
      const sameDateQuotes: Quote[] = [
        createMockQuote('名言1', '著者1', [], '2024-01-01T00:00:00Z'),
        createMockQuote('名言2', '著者2', [], '2024-01-01T00:00:00Z'),
      ]
      const result = sortQuotes(sameDateQuotes)
      expect(result).toHaveLength(2)
    })

    it('空配列で空配列を返す', () => {
      const result = sortQuotes([])
      expect(result).toHaveLength(0)
    })

    it('1件の配列でそのまま返す', () => {
      const singleQuote: Quote[] = [createMockQuote('単一の名言', '著者')]
      const result = sortQuotes(singleQuote)
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('単一の名言')
    })
  })
})
