import type { Quote } from '@/types/quote'
import { createSupabaseClient } from '@/server/utils/supabase.server'

/**
 * Supabaseから取得した名言データの型定義
 * Supabaseの形式（created_at, author_idなど）を表す
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
export default defineEventHandler(async (event): Promise<Quote[]> => {
  const supabase = await createSupabaseClient()
  
  // Supabaseからデータを取得
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch quotes: ${error.message}`,
    })
  }
  
  // Supabaseの形式（created_at, updated_at）をアプリの形式（createdAt, updatedAt）に変換
  return (data || []).map((quote: SupabaseQuote) => ({
    id: quote.id,
    text: quote.text,
    author: quote.author || undefined,
    authorId: quote.author_id || undefined,
    tags: quote.tags || [],
    createdAt: quote.created_at,
    updatedAt: quote.updated_at,
  }))
})