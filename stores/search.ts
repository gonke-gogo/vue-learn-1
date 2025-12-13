import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore(
  'search',
  () => {
    // 検索クエリ（入力用）
    const searchQuery = ref('')
    // 実際に検索に使用するクエリ
    const activeSearchQuery = ref('')

    function setSearchQuery(query: string) {
      searchQuery.value = query
    }

    function setActiveSearchQuery(query: string) {
      activeSearchQuery.value = query
    }

    function executeSearch() {
      // 空文字の場合は全件表示（検索クエリをクリア）
      if (!searchQuery.value.trim()) {
        activeSearchQuery.value = ''
      } else {
        activeSearchQuery.value = searchQuery.value.trim()
      }
    }

    function clearSearch() {
      searchQuery.value = ''
      activeSearchQuery.value = ''
    }

    return {
      searchQuery,
      activeSearchQuery,
      setSearchQuery,
      setActiveSearchQuery,
      executeSearch,
      clearSearch,
    }
  },
  {
    persist: true, // ← これだけでOK
  }
)
