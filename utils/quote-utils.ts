import type { Quote } from '@/types/quote'

/**
 * 名言を検索する（純粋関数）
 * @param quotes 検索対象の名言配列
 * @param query 検索クエリ
 * 配列はいずれかが一致したら検索結果に含める
 * @returns 検索結果の名言配列
 *
 */
export function searchQuotes(quotes: Quote[], query: string): Quote[] {
  if (!query.trim()) {
    return [...quotes]
  }
  const lowerQuery = query.toLowerCase()
  return quotes.filter(
    (quote) =>
      quote.text.toLowerCase().includes(lowerQuery) ||
      quote.author?.toLowerCase().includes(lowerQuery) ||
      quote.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * タグで名言をフィルタリングする（純粋関数）
 * @param quotes フィルタリング対象の名言配列
 * @param tags フィルタリングするタグ配列
 * @returns フィルタリング結果の名言配列
 */
export function filterByTags(quotes: Quote[], tags: string[]): Quote[] {
  if (tags.length === 0) {
    return [...quotes]
  }
  return quotes.filter((quote) => tags.some((tag) => quote.tags?.includes(tag)))
}

/**
 * 名言を日付でソートする（純粋関数）
 * @param quotes ソート対象の名言配列
 * @param order ソート順（'asc': 昇順, 'desc': 降順）
 * @returns ソート結果の名言配列
 */
export function sortQuotes(quotes: Quote[], order: 'asc' | 'desc' = 'desc'): Quote[] {
  const sorted = [...quotes].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
  return sorted
}
