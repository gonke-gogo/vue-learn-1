import type { Quote } from '@/types/quote'
import { createSupabaseClient } from '@/server/utils/supabase.server'

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
  
  const supabase = await createSupabaseClient()
  
  // Supabaseからデータを取得
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // データが見つからない場合
      throw createError({
        statusCode: 404,
        message: 'Quote not found',
      })
    }
    throw createError({
      statusCode: 500,
      message: `Failed to fetch quote: ${error.message}`,
    })
  }
  
  if (!data) {
    throw createError({
      statusCode: 404,
      message: 'Quote not found',
    })
  }
  
  // Supabaseの形式をアプリの形式に変換
  return {
    id: data.id,
    text: data.text,
    author: data.author || undefined,
    authorId: data.author_id || undefined,
    tags: data.tags || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
})

