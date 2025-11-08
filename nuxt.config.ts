// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  css: ['~/assets/styles/base.css'],
  vite: {
    plugins: [tsconfigPaths()],
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    }
  }
})

