-- Supabaseデータベーステーブル作成用SQL
-- Supabaseのダッシュボードの「SQL Editor」で実行してください

-- 著者テーブル
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 名言テーブル
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT, -- 後方互換性のため残す（非推奨）
  author_id TEXT REFERENCES authors(id) ON DELETE SET NULL,
  tags TEXT[], -- PostgreSQLの配列型
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_quotes_author_id ON quotes(author_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

-- Row Level Security (RLS) の設定
-- すべてのユーザーが読み取り・書き込み可能にする（学習用）
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成（すべてのユーザーがアクセス可能）
CREATE POLICY "Allow all operations on authors" ON authors
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on quotes" ON quotes
  FOR ALL
  USING (true)
  WITH CHECK (true);

