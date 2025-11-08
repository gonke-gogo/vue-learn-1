import type { Quote } from '@/types/quote'
import type { QuoteRepository, RepositoryError } from './QuoteRepository'
import { generateId } from '@/utils/id'

const STORAGE_KEY = 'motivator.quotes'

export class LocalQuoteRepository implements QuoteRepository {
  private getQuotes(): Quote[] {
    try {
      if (typeof window === 'undefined') {
        return []
      }
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      return JSON.parse(stored) as Quote[]
    } catch (error) {
      throw new RepositoryError('Failed to read quotes from storage', error)
    }
  }

  private saveQuotes(quotes: Quote[]): void {
    try {
      if (typeof window === 'undefined') {
        throw new RepositoryError('localStorage is not available')
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
    } catch (error) {
      throw new RepositoryError('Failed to save quotes to storage', error)
    }
  }

  async list(): Promise<Quote[]> {
    return this.getQuotes()
  }

  async get(id: string): Promise<Quote | null> {
    const quotes = this.getQuotes()
    return quotes.find((q) => q.id === id) || null
  }

  async add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    const quotes = this.getQuotes()
    const now = new Date().toISOString()
    const newQuote: Quote = {
      ...quote,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    quotes.push(newQuote)
    this.saveQuotes(quotes)
    return newQuote
  }

  async update(
    id: string,
    updates: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Quote> {
    const quotes = this.getQuotes()
    const index = quotes.findIndex((q) => q.id === id)
    if (index === -1) {
      throw new RepositoryError(`Quote with id ${id} not found`)
    }
    quotes[index] = {
      ...quotes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveQuotes(quotes)
    return quotes[index]
  }

  async remove(id: string): Promise<void> {
    const quotes = this.getQuotes()
    const filtered = quotes.filter((q) => q.id !== id)
    if (filtered.length === quotes.length) {
      throw new RepositoryError(`Quote with id ${id} not found`)
    }
    this.saveQuotes(filtered)
  }
}

