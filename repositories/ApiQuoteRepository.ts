import type { Quote } from '@/types/quote'
import type { QuoteRepository } from './QuoteRepository'
import { RepositoryError } from './QuoteRepository'

/**
 * REST APIを使用したQuoteRepositoryの実装
 * Nuxt 3の$fetchを使用してHTTP通信を行う
 */
export class ApiQuoteRepository implements QuoteRepository {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // 環境変数からAPIのベースURLを取得（デフォルトは /api）
    this.baseUrl = baseUrl || process.env.NUXT_PUBLIC_API_BASE_URL || '/api'
  }

  private async request<T>(
    endpoint: string,
    options?: { method?: string; body?: unknown }
  ): Promise<T> {
    const method = options?.method || 'GET'
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await $fetch<T>(url, {
        method:
          (method as
            | 'GET'
            | 'POST'
            | 'PUT'
            | 'DELETE'
            | 'PATCH'
            | 'HEAD'
            | 'OPTIONS'
            | 'TRACE'
            | 'CONNECT'
            | undefined) || 'GET',
        body: options?.body as Record<string, any> | BodyInit | null | undefined,
      })
      return response as T
    } catch (error: unknown) {
      // エラーレスポンスを適切に処理
      const errorObj = error as {
        data?: { message?: string }
        message?: string
        statusCode?: number
        status?: number
      }
      const message = errorObj?.data?.message || errorObj?.message || 'API request failed'
      throw new RepositoryError(message, error)
    }
  }

  async list(): Promise<Quote[]> {
    return this.request<Quote[]>('/quotes', {
      method: 'GET',
    })
  }

  async get(id: string): Promise<Quote | null> {
    try {
      return await this.request<Quote>(`/quotes/${id}`, {
        method: 'GET',
      })
    } catch (error: unknown) {
      // 404の場合はnullを返す
      const errorObj = error as { statusCode?: number; status?: number }
      if (errorObj?.statusCode === 404 || errorObj?.status === 404) {
        return null
      }
      throw error
    }
  }

  async add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    return this.request<Quote>('/quotes', {
      method: 'POST',
      body: quote,
    })
  }

  async update(
    id: string,
    updates: Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Quote> {
    return this.request<Quote>(`/quotes/${id}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async remove(id: string): Promise<void> {
    await this.request<void>(`/quotes/${id}`, {
      method: 'DELETE',
    })
  }
}
