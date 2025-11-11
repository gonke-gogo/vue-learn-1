import type { Quote } from '@/types/quote'
import { getQuotes } from '~/server/utils/quotes-storage'

/**
 * GET /api/quotes
 * 名言一覧を取得
 */
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})

