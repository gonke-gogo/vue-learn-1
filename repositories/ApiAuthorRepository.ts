import type { Author } from '@/types/author'
import type { AuthorRepository } from './AuthorRepository'
import { RepositoryError } from './QuoteRepository'

/**
 * REST APIを使用したAuthorRepositoryの実装
 * Nuxt 3の$fetchを使用してHTTP通信を行う
 */
export class ApiAuthorRepository implements AuthorRepository {
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

  async list(): Promise<Author[]> {
    return this.request<Author[]>('/authors', {
      method: 'GET',
    })
  }

  async get(id: string): Promise<Author | null> {
    try {
      return await this.request<Author>(`/authors/${id}`, {
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

  async getByName(name: string): Promise<Author | null> {
    // まず全件取得してから名前で検索
    // 注: 本番環境では、サーバー側で名前検索のエンドポイントを実装することを推奨
    const authors = await this.list()
    return authors.find((a) => a.name === name) || null
  }

  async add(author: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Promise<Author> {
    return this.request<Author>('/authors', {
      method: 'POST',
      body: author,
    })
  }

  async update(
    id: string,
    updates: Partial<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Author> {
    return this.request<Author>(`/authors/${id}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async remove(id: string): Promise<void> {
    await this.request<void>(`/authors/${id}`, {
      method: 'DELETE',
    })
  }
}

