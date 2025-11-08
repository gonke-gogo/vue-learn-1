import type { QuoteRepository } from './QuoteRepository'
import { LocalQuoteRepository } from './LocalQuoteRepository'

export function createQuoteRepository(): QuoteRepository {
  return new LocalQuoteRepository()
}

