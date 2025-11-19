/**
 * Supabaseクライアントを作成
 * 環境変数からURLとキーを取得
 * 動的インポートを使用してクライアントサイドにバンドルされないようにする
 */
export async function createSupabaseClient() {
  // 動的インポートを使用してサーバーサイドでのみ実行されるようにする
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase環境変数が設定されていません。.envファイルにSUPABASE_URLとSUPABASE_ANON_KEYを設定してください。'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

