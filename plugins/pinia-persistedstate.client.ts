import { createPersistedState } from 'pinia-plugin-persistedstate'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin(() => {
  const pinia = usePinia() as Pinia
  pinia.use(createPersistedState())
})

