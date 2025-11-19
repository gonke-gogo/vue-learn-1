import type { Author } from '@/types/author'
import { generateId } from '@/utils/id'
import { createSupabaseClient } from '@/server/utils/supabase.server'

/**
 * POST /api/authors
 * 著者を新規作成
 */
export default defineEventHandler(async (event): Promise<Author> => {
  const body = await readBody<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>(event)
  
  const supabase = await createSupabaseClient()
  
  const now = new Date().toISOString()
  const newAuthorId = generateId()
  
  // アプリの形式（createdAt, updatedAt）をSupabaseの形式（created_at, updated_at）に変換
  const supabaseAuthor = {
    id: newAuthorId,
    name: body.name,
    created_at: now,
    updated_at: now,
  }
  
  // Supabaseにデータを挿入
  const { data, error } = await supabase
    .from('authors')
    .insert([supabaseAuthor])
    .select()
    .single()
  
  if (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to create author: ${error.message}`,
    })
  }
  
  // Supabaseの形式をアプリの形式に変換
  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
})

