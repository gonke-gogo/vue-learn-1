import type { QuoteRepository } from './QuoteRepository'
import type { AuthorRepository } from './AuthorRepository'
import { LocalQuoteRepository } from './LocalQuoteRepository'
import { ApiQuoteRepository } from './ApiQuoteRepository'
import { LocalAuthorRepository } from './LocalAuthorRepository'
import { ApiAuthorRepository } from './ApiAuthorRepository'

/**
 * 環境変数に応じて適切なRepositoryを返す
 * - USE_API=true の場合: ApiQuoteRepository（REST API使用）
 * - それ以外: LocalQuoteRepository（localStorage使用）
 */
export function createQuoteRepository(): QuoteRepository {
  let useApi = false
  let apiBaseUrl = '/api'

  // サーバーサイドとクライアントサイドの両方で動作するように
  if (import.meta.server) {
    // サーバーサイド
    useApi = process.env.NUXT_PUBLIC_USE_API === 'true'
    apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || '/api'
  } else {
    // クライアントサイド: useRuntimeConfig()を使用
    const config = useRuntimeConfig()
    const useApiValue = config.public.useApi
    useApi = useApiValue === true || (typeof useApiValue === 'string' && useApiValue === 'true')
    apiBaseUrl = config.public.apiBaseUrl || '/api'
  }

  if (useApi) {
    return new ApiQuoteRepository(apiBaseUrl)
  }

  return new LocalQuoteRepository()
}

/**
 * 環境変数に応じて適切なAuthorRepositoryを返す
 * - USE_API=true の場合: ApiAuthorRepository（REST API使用）
 * - それ以外: LocalAuthorRepository（localStorage使用）
 */
export function createAuthorRepository(): AuthorRepository {
  let useApi = false
  let apiBaseUrl = '/api'

  // サーバーサイドとクライアントサイドの両方で動作するように
  if (import.meta.server) {
    // サーバーサイド
    useApi = process.env.NUXT_PUBLIC_USE_API === 'true'
    apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL || '/api'
  } else {
    // クライアントサイド: useRuntimeConfig()を使用
    const config = useRuntimeConfig()
    const useApiValue = config.public.useApi
    useApi = useApiValue === true || (typeof useApiValue === 'string' && useApiValue === 'true')
    apiBaseUrl = config.public.apiBaseUrl || '/api'
  }

  if (useApi) {
    return new ApiAuthorRepository(apiBaseUrl)
  }

  return new LocalAuthorRepository()
}
