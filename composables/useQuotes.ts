import { computed } from 'vue'
import { useQuotesStore } from '@/stores/quotes'
import { useAuthorsStore } from '@/stores/authors'
import type { Quote } from '@/types/quote'
import {
  searchQuotes as searchQuotesUtil,
  filterByTags as filterByTagsUtil,
  sortQuotes as sortQuotesUtil,
} from '@/utils/quote-utils'

export function useQuotes() {
  const store = useQuotesStore()
  const authorsStore = useAuthorsStore()

  const searchQuotes = (query: string): Quote[] => {
    return searchQuotesUtil([...store.quotes] as Quote[], query)
  }

  const filterByTags = (tags: string[]): Quote[] => {
    return filterByTagsUtil([...store.quotes] as Quote[], tags)
  }

  const sortQuotes = (quotes: Quote[], order: 'asc' | 'desc' = 'desc'): Quote[] => {
    return sortQuotesUtil(quotes, order)
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
