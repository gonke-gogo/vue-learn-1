import type { QuoteRepository } from './QuoteRepository'
import { LocalQuoteRepository } from './LocalQuoteRepository'
import { ApiQuoteRepository } from './ApiQuoteRepository'

/**
 * 環境変数に応じて適切なRepositoryを返す
 * - USE_API=true の場合: ApiQuoteRepository（REST API使用）
 * - それ以外: LocalQuoteRepository（localStorage使用）
 */
export function createQuoteRepository(): QuoteRepository {
  // 環境変数でAPIを使用するかどうかを判定
  const useApi = process.env.NUXT_PUBLIC_USE_API === 'true'
  
  if (useApi) {
    const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || '/api'
    return new ApiQuoteRepository(apiBaseUrl)
  }
  
  return new LocalQuoteRepository()
}

