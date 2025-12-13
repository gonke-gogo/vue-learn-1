export default defineNuxtPlugin(() => {
  const store = useThemeStore()

  const apply = () => {
    document.documentElement.setAttribute('data-theme', store.theme)
  }

  // 初回適用（persistで復元された値を反映）
  apply()

  // 以降の変更も追従
  store.$subscribe(apply)
})
