import type { Author } from '@/types/author'
import { createSupabaseClient } from '@/server/utils/supabase.server'

/**
 * GET /api/authors
 * 著者一覧を取得
 */
export default defineEventHandler(async (event): Promise<Author[]> => {
  const supabase = await createSupabaseClient()
  
  // Supabaseからデータを取得
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to fetch authors: ${error.message}`,
    })
  }
  
  // Supabaseの形式（created_at, updated_at）をアプリの形式（createdAt, updatedAt）に変換
  return (data || []).map((author) => ({
    id: author.id,
    name: author.name,
    createdAt: author.created_at,
    updatedAt: author.updated_at,
  }))
})

