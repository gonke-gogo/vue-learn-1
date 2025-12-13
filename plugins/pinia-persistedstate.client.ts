import { createPersistedState } from 'pinia-plugin-persistedstate'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin({
  name: 'pinia-persistedstate',
  enforce: 'post', // Piniaが初期化された後に実行されるようにする
  setup(nuxtApp) {
    // nuxtApp.$pinia を使用（Nuxt3の標準的な方法）
    const pinia = nuxtApp.$pinia as unknown as Pinia | undefined
    if (pinia) {
      pinia.use(createPersistedState())
    }
  },
})
