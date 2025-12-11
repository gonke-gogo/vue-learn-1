import { defineStore } from 'pinia'
import type { Quote } from '@/types/quote'
import type { QuoteRepository } from '@/repositories/QuoteRepository'
import { createQuoteRepository } from '@/repositories/factory'

export const useQuotesStore = defineStore('quotes', () => {
  const repository: QuoteRepository = createQuoteRepository()
  const quotes = ref<Quote[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadQuotes() {
    isLoading.value = true
    error.value = null
    try {
      quotes.value = await repository.list()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quotes'
      error.value = errorMessage
    } finally {
      isLoading.value = false
    }
  }

  async function addQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true
    error.value = null
    try {
      const newQuote = await repository.add(quote)
      quotes.value.push(newQuote)
      return newQuote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add quote'
      error.value = errorMessage
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateQuote(
    id: string,
    updates: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
  ) {
    isLoading.value = true
    error.value = null
    try {
      const updated = await repository.update(id, updates)
      const index = quotes.value.findIndex((q) => q.id === id)
      if (index !== -1) {
        quotes.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update quote'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeQuote(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await repository.remove(id)
      quotes.value = quotes.value.filter((q) => q.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove quote'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getQuote(id: string): Quote | undefined {
    return quotes.value.find((q) => q.id === id)
  }

  return {
    quotes: readonly(quotes),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadQuotes,
    addQuote,
    updateQuote,
    removeQuote,
    getQuote,
  }
})
