nvm use        # Node.js 20.19.0に切り替え
npm run dev    # 開発サーバーを起動

# やる気の出る名言アプリ

Nuxt 3 / Vue 3 / TypeScript で構築された学習用CRUDアプリケーションです。

## 機能

- **名言の管理**: やる気の出る名言を保存・一覧・更新・削除
- **今日の名言**: 日付と気分（1〜5）をシードに、決定性のあるランダム名言を表示
- **データ永続化**: localStorage または REST API を使用（環境変数で切り替え可能）

## 技術スタック

- **フレームワーク**: Nuxt 3
- **言語**: TypeScript (strict mode)
- **状態管理**: Pinia
- **ユーティリティ**: @vueuse/core
- **スタイリング**: CSS Modules + PostCSS (autoprefixer)
- **テスト**: Vitest
- **リンター**: ESLint + Prettier

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### REST APIの使用（オプション）

デフォルトではlocalStorageを使用しますが、REST APIを使用することもできます。

1. `.env`ファイルを作成

```bash
# APIを使用する場合
NUXT_PUBLIC_USE_API=true
NUXT_PUBLIC_API_BASE_URL=/api
```

2. 環境変数を設定
   - `NUXT_PUBLIC_USE_API=true`: REST APIを使用
   - `NUXT_PUBLIC_API_BASE_URL`: APIのベースURL（デフォルトは `/api`）

3. 開発サーバーを再起動

```bash
npm run dev
```

**実装済み**: Nuxt 3のServer API Routes（`server/api/quotes/`）が実装されています。同じプロジェクト内でREST APIを試すことができます。

**注意**: 現在の実装では、データはメモリ上に保存されます。サーバーを再起動するとデータは消えます（学習用の簡易実装）。

### ビルド

```bash
npm run build
```

### テスト

```bash
npm test
```

### リンター

```bash
npm run lint
```

### フォーマッター

```bash
npm run format
```

## プロジェクト構造

```
vue-learn-1/
├── assets/
│   └── styles/
│       └── base.css          # グローバルスタイル、CSS変数、ダークモード
├── composables/
│   ├── useQuotes.ts          # 名言の検索・フィルタ・ソート
│   ├── useSeededRandom.ts    # シード付きランダム生成
│   └── __tests__/            # テストファイル
├── data/
│   └── seed-quotes.ts        # 初期名言データ
├── layouts/
│   └── default.vue          # デフォルトレイアウト（ヘッダー/フッター/テーマ切替）
├── pages/
│   ├── index.vue             # 今日の名言ページ
│   └── quotes.vue            # 名言一覧・CRUDページ
├── repositories/
│   ├── QuoteRepository.ts    # Repository インターフェース
│   ├── LocalQuoteRepository.ts # localStorage実装
│   ├── ApiQuoteRepository.ts  # REST API実装
│   ├── factory.ts            # Repository ファクトリ（環境変数で切り替え）
│   └── __tests__/            # テストファイル
├── server/
│   ├── api/
│   │   └── quotes/           # REST APIエンドポイント（Nuxt 3 Server API Routes）
│   │       ├── index.get.ts  # GET /api/quotes
│   │       ├── index.post.ts # POST /api/quotes
│   │       └── [id].get.ts   # GET /api/quotes/:id
│   │       └── [id].put.ts   # PUT /api/quotes/:id
│   │       └── [id].delete.ts # DELETE /api/quotes/:id
│   └── utils/
│       └── quotes-storage.ts # メモリ上にデータを保存（学習用）
├── stores/
│   └── quotes.ts             # Piniaストア
├── types/
│   └── quote.ts              # Quote型定義
└── utils/
    └── id.ts                 # ID生成ユーティリティ（ulid）
```

## 学びポイント

### 1. Repository パターン

データアクセス層を抽象化し、将来的にSupabase等の外部サービスへ差し替え可能な設計にしています。

```typescript
// インターフェース定義
interface QuoteRepository {
  list(): Promise<Quote[]>
  get(id: string): Promise<Quote | null>
  add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote>
  // ...
}

// 実装
class LocalQuoteRepository implements QuoteRepository {
  // localStorage実装
}
```

### 2. Pinia ストア（Composition API）

Composition APIスタイルでストアを定義し、型安全性を確保しています。

```typescript
export const useQuotesStore = defineStore('quotes', () => {
  const repository = createQuoteRepository()
  const quotes = ref<Quote[]>([])
  // ...
  return { quotes, loadQuotes, addQuote, ... }
})
```

### 3. Composables

再利用可能なロジックをcomposablesに分離しています。

- `useQuotes`: 名言の検索・フィルタ・ソート機能
- `useSeededRandom`: 決定性のあるランダム生成（日付+mood+salt）

### 4. 決定性のあるランダム生成

同じ日付・気分・saltの組み合わせで、常に同じ名言が選ばれるように実装しています。mulberry32アルゴリズムとFNV-1aハッシュを使用。

### 5. CSS変数によるテーマ管理

CSS変数と`prefers-color-scheme`、`data-theme`属性を組み合わせてダークモードを実現。

### 6. TypeScript strict mode

厳密な型チェックにより、実行時エラーを事前に防ぎます。

### 7. テスト駆動開発

Vitestを使用した単体テストを実装。Repository層とcomposablesのテストを用意。

## 今後の拡張案

- [ ] Supabase等の外部サービスへの移行
- [ ] タグによるフィルタリング機能の強化
- [ ] 名言のエクスポート/インポート機能
- [ ] お気に入り機能
- [ ] 統計情報の表示

## ライセンス

MIT

