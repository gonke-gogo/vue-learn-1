import type { Quote } from '@/types/quote'
import { getQuotes, saveQuotes } from '@/server/utils/quotes-storage'

/**
 * PUT /api/quotes/:id
 * 指定IDの名言を更新
 */
export default defineEventHandler(async (event): Promise<Quote> => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }
  
  const body = await readBody<Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>>(event)
  const quotes = getQuotes()
  const index = quotes.findIndex((q) => q.id === id)
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      message: 'Quote not found',
    })
  }
  
  quotes[index] = {
    ...quotes[index],
    ...body,
    updatedAt: new Date().toISOString(),
  }
  
  saveQuotes(quotes)
  
  return quotes[index]
})

