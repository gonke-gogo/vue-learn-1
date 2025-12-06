/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // 開発モードでのパフォーマンス最適化
  corePlugins: {
    preflight: true,
  },
  // 開発モードでのコンパイルを最適化
  safelist: [],
}
