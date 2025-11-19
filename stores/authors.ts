import { defineStore } from 'pinia'
import type { Author } from '@/types/author'
import type { AuthorRepository } from '@/repositories/AuthorRepository'
import { createAuthorRepository } from '@/repositories/factory'

export const useAuthorsStore = defineStore('authors', () => {
  const repository: AuthorRepository = createAuthorRepository()
  const authors = ref<Author[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadAuthors() {
    isLoading.value = true
    error.value = null
    try {
      authors.value = await repository.list()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load authors'
    } finally {
      isLoading.value = false
    }
  }

  async function addAuthor(author: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true
    error.value = null
    try {
      const newAuthor = await repository.add(author)
      authors.value.push(newAuthor)
      return newAuthor
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to add author'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateAuthor(
    id: string,
    updates: Partial<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>
  ) {
    isLoading.value = true
    error.value = null
    try {
      const updated = await repository.update(id, updates)
      const index = authors.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        authors.value[index] = updated
      }
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update author'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeAuthor(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await repository.remove(id)
      authors.value = authors.value.filter((a) => a.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove author'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getAuthor(id: string): Author | undefined {
    return authors.value.find((a) => a.id === id)
  }

  async function getOrCreateAuthorByName(name: string): Promise<Author> {
    // 既存の著者を検索
    const existing = await repository.getByName(name)
    if (existing) {
      return existing
    }
    // 存在しない場合は新規作成
    return await addAuthor({ name })
  }

  return {
    authors: readonly(authors),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadAuthors,
    addAuthor,
    updateAuthor,
    removeAuthor,
    getAuthor,
    getOrCreateAuthorByName,
  }
}, {
  persist: {
    pick: ['authors'],
  },
})

