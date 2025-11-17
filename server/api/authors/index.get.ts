import type { Author } from '@/types/author'
import { getAuthors } from '~/server/utils/authors-storage'

/**
 * GET /api/authors
 * 著者一覧を取得
 */
export default defineEventHandler(async (event): Promise<Author[]> => {
  return getAuthors()
})

