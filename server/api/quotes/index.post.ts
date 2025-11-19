import type { Quote } from '@/types/quote'
import { generateId } from '@/utils/id'
import { createSupabaseClient } from '@/server/utils/supabase.server'

/**
 * POST /api/quotes
 * 名言を新規作成
 */
export default defineEventHandler(async (event): Promise<Quote> => {
  const body = await readBody<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>(event)
  
  const supabase = await createSupabaseClient()
  
  // authorIdが指定されている場合、存在確認を行い、著者名も取得する
  let authorId = body.authorId || null
  let authorName = body.author || null
  if (authorId) {
    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, name')
      .eq('id', authorId)
      .single()
    
    if (authorError || !author) {
      authorId = null
      authorName = null
    } else {
      // authorIdが存在する場合、著者名を取得して設定
      authorName = author.name
    }
  }
  
  const now = new Date().toISOString()
  const newQuoteId = generateId()
  
  // アプリの形式（createdAt, updatedAt, authorId）をSupabaseの形式（created_at, updated_at, author_id）に変換
  const supabaseQuote = {
    id: newQuoteId,
    text: body.text,
    author: authorName, // authorIdから取得した著者名を設定
    author_id: authorId,
    tags: body.tags || [],
    created_at: now,
    updated_at: now,
  }
  
  // Supabaseにデータを挿入
  const { data, error } = await supabase
    .from('quotes')
    .insert([supabaseQuote])
    .select()
    .single()
  
  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to create quote: ${error.message}`,
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

