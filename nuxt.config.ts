// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },
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
  // SSRのパフォーマンス最適化とFOUC防止
  app: {
    head: {
      htmlAttrs: {
        lang: 'ja',
      },
    },
  },
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
      // CSSの最適化
      devSourcemap: false, // 開発モードでのソースマップを無効化（パフォーマンス向上）
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
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
    // SSRのタイムアウト設定（30秒）
    routeRules: {
      '/**': {
        ssr: true,
        headers: {
          'Cache-Control': 's-maxage=60',
        },
      },
    },
    // リクエストのタイムアウト設定
    timing: true,
  },
  build: {
    transpile: [],
  },
})
