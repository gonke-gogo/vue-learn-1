import type { Quote } from '@/types/quote'

export class RepositoryError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export interface QuoteRepository {
  list(): Promise<Quote[]>
  get(id: string): Promise<Quote | null>
  add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote>
  update(id: string, quote: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Quote>
  remove(id: string): Promise<void>
}

