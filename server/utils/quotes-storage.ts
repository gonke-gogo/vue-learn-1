import type { Quote } from '@/types/quote'

/**
 * メモリ上に名言データを保存する簡易ストレージ
 * サーバー再起動でデータは消えます（学習用）
 */
let quotesStorage: Quote[] = []

/**
 * 名言一覧を取得
 */
export function getQuotes(): Quote[] {
  return [...quotesStorage]
}

/**
 * 名言一覧を保存
 */
export function saveQuotes(quotes: Quote[]): void {
  quotesStorage = [...quotes]
}

/**
 * ストレージをクリア（テスト用）
 */
export function clearQuotes(): void {
  quotesStorage = []
}

