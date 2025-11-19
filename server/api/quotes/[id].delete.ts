import { createSupabaseClient } from '@/server/utils/supabase.server'

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
  
  const supabase = await createSupabaseClient()
  
  // 削除前に存在確認を行う
  const { data: existingQuote } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', id)
    .single()
  
  if (!existingQuote) {
    throw createError({
      statusCode: 404,
      message: 'Quote not found',
    })
  }
  
  // Supabaseからデータを削除
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
  
  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to delete quote: ${error.message}`,
    })
  }
})

