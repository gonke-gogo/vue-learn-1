import { getQuotes, saveQuotes } from '~/server/utils/quotes-storage'

/**
 * DELETE /api/quotes/:id
 * 指定IDの名言を削除
 */
export default defineEventHandler(async (event): Promise<void> => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID is required',
    })
  }
  
  const quotes = getQuotes()
  const filtered = quotes.filter((q) => q.id !== id)
  
  if (filtered.length === quotes.length) {
    throw createError({
      statusCode: 404,
      message: 'Quote not found',
    })
  }
  
  saveQuotes(filtered)
})

