/**
 * Supabaseクライアントをシングルトンとして管理
 * リクエストごとに新しいクライアントを作成せず、1つのインスタンスを再利用
 */
let supabaseClient: any = null

/**
 * Supabaseクライアントを作成（シングルトンパターン）
 * 環境変数からURLとキーを取得
 * 動的インポートを使用してクライアントサイドにバンドルされないようにする
 */
export async function createSupabaseClient() {
  // 既にクライアントが作成されている場合は再利用
  if (supabaseClient) {
    return supabaseClient
  }

  // supabaseを作成するための関数をインポート
  const { createClient } = await import('@supabase/supabase-js')

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase環境変数が設定されていません。.envファイルにSUPABASE_URLとSUPABASE_ANON_KEYを設定してください。'
    )
  }

  // Supabaseクライアントを作成（タイムアウト設定を追加）
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // サーバーサイドではセッションを保持しない
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-info': 'nuxt-server',
      },
      // タイムアウト設定（10秒）
      fetch: (url: string, options: RequestInit = {}) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒でタイムアウト

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId)
        })
      },
    },
  } as any)

  return supabaseClient
}
