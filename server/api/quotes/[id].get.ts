import type { Quote } from '@/types/quote'
import { getQuotes } from '~/server/utils/quotes-storage'

/**
 * GET /api/quotes/:id
 * 指定IDの名言を取得
 */
export default defineEventHandler(async (event): Promise<Quote | null> => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }
  
  const quotes = getQuotes()
  const quote = quotes.find((q) => q.id === id)
  
  if (!quote) {
    throw createError({
      statusCode: 404,
      message: 'Quote not found',
    })
  }
  
  return quote
})

