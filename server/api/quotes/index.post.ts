import type { Quote } from '@/types/quote'
import { generateId } from '@/utils/id'
import { getQuotes, saveQuotes } from '~/server/utils/quotes-storage'

/**
 * POST /api/quotes
 * 名言を新規作成
 */
export default defineEventHandler(async (event): Promise<Quote> => {
  const body = await readBody<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>(event)
  
  const quotes = getQuotes()
  const now = new Date().toISOString()
  const newQuote: Quote = {
    ...body,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  
  quotes.push(newQuote)
  saveQuotes(quotes)
  
  return newQuote
})

