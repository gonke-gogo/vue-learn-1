import type { Quote } from '@/types/quote'
import type { QuoteRepository, RepositoryError } from './QuoteRepository'

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
    options?: { method?: string; body?: any }
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await $fetch<T>(url, {
        method: options?.method || 'GET',
        body: options?.body,
      })
      return response
    } catch (error: any) {
      // エラーレスポンスを適切に処理
      const message =
        error?.data?.message || error?.message || 'API request failed'
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
    } catch (error: any) {
      // 404の場合はnullを返す
      if (error?.statusCode === 404 || error?.status === 404) {
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

