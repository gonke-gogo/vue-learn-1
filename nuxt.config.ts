// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  css: ['~/assets/styles/base.scss'],
  runtimeConfig: {
    public: {
      useApi: process.env.NUXT_PUBLIC_USE_API === 'true',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
    },
  },
  vite: {
    plugins: [tsconfigPaths()],
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    }
  },
  nitro: {
    experimental: {
      wasm: true
    },
    externals: {
      inline: []
    }
  },
  build: {
    transpile: []
  }
})

