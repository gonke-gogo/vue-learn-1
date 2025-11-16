import type { Author } from '@/types/author'

export interface AuthorRepository {
  list(): Promise<Author[]>
  get(id: string): Promise<Author | null>
  getByName(name: string): Promise<Author | null>
  add(author: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Promise<Author>
  update(id: string, author: Partial<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Author>
  remove(id: string): Promise<void>
}

