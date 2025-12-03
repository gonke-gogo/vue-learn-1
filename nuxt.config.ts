// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },
  // 開発環境でのみSSRを無効化（環境変数で制御）
  // NODE_ENV=development かつ NUXT_DISABLE_SSR=true の場合、SSRを無効化
  ssr: process.env.NUXT_DISABLE_SSR !== 'true',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  // Tailwind CSSの設定を最適化
  tailwindcss: {
    exposeConfig: false,
    viewer: false, // Tailwind CSS Viewerを無効化（開発モードでのパフォーマンス向上）
  },
  typescript: {
    strict: true,
    typeCheck: false,
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
        localsConvention: 'camelCase',
      },
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    externals: {
      inline: [],
    },
  },
  build: {
    transpile: [],
  },
})
