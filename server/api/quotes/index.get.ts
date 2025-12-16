import type { Quote } from '@/types/quote'
import { createSupabaseClient } from '@/server/utils/supabase.server'

/**
 * Supabaseから取得した名言データの型定義（DB側の形式）
 */
type SupabaseQuote = {
  id: string
  text: string
  author: string | null
  author_id: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/quotes
 * 名言一覧を取得
 */
export default defineEventHandler(async (_event): Promise<Quote[]> => {
  try {
    const supabase = await createSupabaseClient()

    // 必要カラムだけ取得（* を避ける）
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to fetch quotes: ${error.message}`,
      })
    }

    // DB形式（snake_case）→ アプリ形式（camelCase）に変換
    return (data ?? []).map(
      (q: SupabaseQuote): Quote => ({
        id: q.id,
        text: q.text,
        author: q.author ?? undefined,
        authorId: q.author_id ?? undefined,
        tags: q.tags ?? [],
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      })
    )
  } catch (err: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quotes.',
    })
  }
})
