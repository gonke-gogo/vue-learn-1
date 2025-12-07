import { computed } from 'vue'
import { useQuotesStore } from '@/stores/quotes'
import { useAuthorsStore } from '@/stores/authors'
import type { Quote } from '@/types/quote'

export function useQuotes() {
  const store = useQuotesStore()
  const authorsStore = useAuthorsStore()

  const searchQuotes = (query: string): Quote[] => {
    if (!query.trim()) {
      return [...store.quotes] as Quote[]
    }
    const lowerQuery = query.toLowerCase()
    return store.quotes.filter(
      (quote) =>
        quote.text.toLowerCase().includes(lowerQuery) ||
        quote.author?.toLowerCase().includes(lowerQuery) ||
        quote.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ) as Quote[]
  }

  const filterByTags = (tags: string[]): Quote[] => {
    if (tags.length === 0) {
      return [...store.quotes] as Quote[]
    }
    return store.quotes.filter((quote) => tags.some((tag) => quote.tags?.includes(tag))) as Quote[]
  }

  const sortQuotes = (quotes: Quote[], order: 'asc' | 'desc' = 'desc'): Quote[] => {
    const sorted = [...quotes].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
    return sorted
  }

  // 名言から著者名を取得（authorId優先、なければauthorフィールド）
  const getAuthorName = (quote: Quote): string | undefined => {
    if (quote.authorId) {
      const author = authorsStore.getAuthor(quote.authorId)
      return author?.name
    }
    return quote.author
  }

  return {
    quotes: computed(() => store.quotes),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    loadQuotes: store.loadQuotes,
    addQuote: store.addQuote,
    updateQuote: store.updateQuote,
    removeQuote: store.removeQuote,
    getQuote: store.getQuote,
    searchQuotes,
    filterByTags,
    sortQuotes,
    getAuthorName,
  }
}
