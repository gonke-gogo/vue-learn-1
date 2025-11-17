import type { Author } from '@/types/author'

/**
 * メモリ上に著者データを保存する簡易ストレージ
 * サーバー再起動でデータは消えます（学習用）
 */
let authorsStorage: Author[] = []

/**
 * 著者一覧を取得
 */
export function getAuthors(): Author[] {
  return [...authorsStorage]
}

/**
 * 著者一覧を保存
 */
export function saveAuthors(authors: Author[]): void {
  authorsStorage = [...authors]
}

/**
 * ストレージをクリア（テスト用）
 */
export function clearAuthors(): void {
  authorsStorage = []
}

