import { createPersistedState } from 'pinia-plugin-persistedstate'
import { getActivePinia } from 'pinia'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin(() => {
  const pinia = getActivePinia() as Pinia
  if (pinia) {
    pinia.use(createPersistedState())
  }
})
