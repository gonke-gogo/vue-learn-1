import type { Author } from '@/types/author'
import type { AuthorRepository } from './AuthorRepository'
import { RepositoryError } from './QuoteRepository'
import { generateId } from '@/utils/id'

const STORAGE_KEY = 'motivator.authors'

export class LocalAuthorRepository implements AuthorRepository {
  private getAuthors(): Author[] {
    try {
      if (typeof window === 'undefined') {
        return []
      }
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return []
      }
      return JSON.parse(stored) as Author[]
    } catch (error) {
      throw new RepositoryError('Failed to read authors from storage', error)
    }
  }

  private saveAuthors(authors: Author[]): void {
    try {
      if (typeof window === 'undefined') {
        throw new RepositoryError('localStorage is not available')
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authors))
    } catch (error) {
      throw new RepositoryError('Failed to save authors to storage', error)
    }
  }

  async list(): Promise<Author[]> {
    return [...this.getAuthors()]
  }

  async get(id: string): Promise<Author | null> {
    const authors = this.getAuthors()
    return authors.find((a) => a.id === id) || null
  }

  async getByName(name: string): Promise<Author | null> {
    const authors = this.getAuthors()
    return authors.find((a) => a.name === name) || null
  }

  async add(author: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Promise<Author> {
    const authors = this.getAuthors()
    const now = new Date().toISOString()
    const newAuthor: Author = {
      ...author,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    authors.push(newAuthor)
    this.saveAuthors(authors)
    return newAuthor
  }

  async update(
    id: string,
    updates: Partial<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Author> {
    const authors = this.getAuthors()
    const index = authors.findIndex((a) => a.id === id)
    if (index === -1) {
      throw new RepositoryError(`Author with id ${id} not found`)
    }
    authors[index] = {
      ...authors[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveAuthors(authors)
    return authors[index]
  }

  async remove(id: string): Promise<void> {
    const authors = this.getAuthors()
    const filtered = authors.filter((a) => a.id !== id)
    if (filtered.length === authors.length) {
      throw new RepositoryError(`Author with id ${id} not found`)
    }
    this.saveAuthors(filtered)
  }
}

