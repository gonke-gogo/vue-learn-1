import type { Quote } from '@/types/quote'
import { createSupabaseClient } from '@/server/utils/supabase.server'

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
  const supabase = await createSupabaseClient()
  
  // authorIdが指定されている場合、著者名も取得する
  let authorName = body.author || null
  if (body.authorId !== undefined && body.authorId) {
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, name')
      .eq('id', body.authorId)
      .single()
    
    if (!authorError && author) {
      // authorIdが存在する場合、著者名を取得して設定
      authorName = author.name
    }
  }
  
  // アプリの形式（authorId）をSupabaseの形式（author_id）に変換
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }
  
  if (body.text !== undefined) {
    updateData.text = body.text
  }
  if (body.authorId !== undefined) {
    updateData.author_id = body.authorId || null
    // authorIdが指定されている場合、著者名も更新
    updateData.author = authorName
  } else if (body.author !== undefined) {
    // authorIdが指定されていない場合のみ、body.authorを使用
    updateData.author = body.author || null
  }
  if (body.tags !== undefined) {
    updateData.tags = body.tags || []
  }
  
  // Supabaseでデータを更新
  const { data, error } = await supabase
    .from('quotes')
    .update(updateData)
    .eq('id', id)
    .select()
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
      message: `Failed to update quote: ${error.message}`,
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

