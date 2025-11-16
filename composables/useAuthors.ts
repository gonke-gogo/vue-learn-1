import { computed } from 'vue'
import { useAuthorsStore } from '@/stores/authors'
import type { Author } from '@/types/author'

export function useAuthors() {
  const store = useAuthorsStore()

  return {
    authors: computed(() => store.authors),
    isLoading: computed(() => store.isLoading),
    error: computed(() => store.error),
    loadAuthors: store.loadAuthors,
    addAuthor: store.addAuthor,
    updateAuthor: store.updateAuthor,
    removeAuthor: store.removeAuthor,
    getAuthor: store.getAuthor,
    getOrCreateAuthorByName: store.getOrCreateAuthorByName,
  }
}

