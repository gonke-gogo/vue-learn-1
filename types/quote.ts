export type Quote = {
  id: string
  text: string
  author?: string // 後方互換性のため残す（非推奨）
  authorId?: string // 推奨：著者IDを使用
  tags?: string[]
  createdAt: string
  updatedAt: string
}

