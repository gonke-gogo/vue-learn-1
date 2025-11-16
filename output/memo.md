- 処理の流れ
┌─────────────────────────────────────────┐
│ 1. ブラウザ（UI）                        │
│    ユーザーがフォームに入力して送信       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. pages/quotes.vue                     │
│    handleSubmit()                       │
│    → addQuote(formValue)                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. composables/useQuotes.ts            │
│    useQuotes()                          │
│    → store.addQuote                     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. stores/quotes.ts                     │
│    useQuotesStore.addQuote()            │
│    → repository.add(quote)               │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. repositories/factory.ts              │
│    createQuoteRepository()              │
│    → new LocalQuoteRepository()         │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. repositories/LocalQuoteRepository.ts│
│    add()                                │
│    → getQuotes()                        │
│    → 新しい名言オブジェクト作成          │
│    → saveQuotes(quotes)                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 7. repositories/LocalQuoteRepository.ts│
│    saveQuotes()                         │
│    → localStorage.setItem()              │
└─────────────────────────────────────────┘

- Props / Event / Modelを使ってコンポーネントを実装する事ができる

  **実装内容:**
  - `components/QuoteForm.vue`を作成し、共通フォームコンポーネントとして実装
  - Props定義: `modelValue`（フォームの値）、`isEditMode`（編集モード判定）、`isLoading`（ローディング状態）
  - Event定義: `update:modelValue`（双方向バインディング用）、`submit`（サブミット時）、`cancel`（キャンセル時）
  - `pages/quotes.vue`で`QuoteForm`コンポーネントを使用し、登録・編集の両方で共通化

  **技術的なポイント:**
  - Vue 3のComposition API（`<script setup>`）を使用
  - TypeScriptで型安全性を確保（`defineProps<Props>()`、`defineEmits<{}>()`）
  - Nuxt 3の自動インポート機能により、`components/`配下のコンポーネントは自動的にインポートされる

- 双方向バインディングを理解して正しく使う事ができる

  **実装内容:**
  - `v-model="form"`を使用して親子コンポーネント間で双方向バインディングを実装
  - 子コンポーネント（`QuoteForm`）で`modelValue`プロップを受け取り、`update:modelValue`イベントで親の値を更新
  - 各入力フィールド（text, author, tags）の変更を`update:modelValue`イベントで親に通知

  **技術的なポイント:**
  - Vue 3の`v-model`は`modelValue`プロップと`update:modelValue`イベントの組み合わせ
  - オブジェクト全体を`v-model`でバインドすることで、複数のフィールドを一度に管理
  - タグ入力はカンマ区切りの文字列として扱い、内部で配列に変換してから親に渡す

  **`v-model`の仕組み（なぜ`modelValue`に自動的に渡されるのか）:**
  
  `v-model="form"`は、Vue 3の糖衣構文（シンタックスシュガー）だ。以下の2つの省略形である：
  
  ```vue
  <!-- これが -->
  <QuoteForm v-model="form" />
  
  <!-- 実際にはこういう意味 -->
  <QuoteForm 
    :modelValue="form" 
    @update:modelValue="form = $event" 
  />
  ```
  
  **動作フロー:**
  1. `:modelValue="form"` → 親の`form`を子の`modelValue`プロップに渡す（Props）
  2. 子コンポーネントで入力が変更される
  3. `emit('update:modelValue', newValue)` → 子が親に新しい値を通知（Event）
  4. `@update:modelValue="form = $event"` → 親の`form`が更新される
  
  **なぜ`modelValue`という名前なのか:**
  - Vue 3では、`v-model`はデフォルトで`modelValue`プロップと`update:modelValue`イベントを使用する規約である
  - 特別な設定は不要で、子コンポーネントで`modelValue`を定義すれば自動的に`v-model`で受け取れる
  - カスタム名を使う場合は`v-model:customName`のように書ける

- EventEmitterを正しく使えること

  **実装内容:**
  - `$emit('submit', formValue)`でフォームの値のみを親コンポーネントに渡す
  - `$emit('cancel')`でキャンセル操作を親に通知
  - 親コンポーネント（`pages/quotes.vue`）で`@submit`と`@cancel`イベントをハンドリング

  **技術的なポイント:**
  - Vue 3では`defineEmits`でイベントを型安全に定義
  - サブミット時はフォームの値（`formValue`）のみを親に渡し、親側で`addQuote`/`updateQuote`を実行
  - 子コンポーネントはビジネスロジックを持たず、純粋にフォームの表示と値の管理のみを担当（関心の分離）

  **`defineEmits`の詳細解説:**
  
  `defineEmits`は、Vue 3のComposition APIでイベントを定義するための関数だ。TypeScriptと組み合わせることで、型安全にイベントを発火できる。
  
  **基本的な使い方:**
  ```typescript
  // イベントを定義
  const emit = defineEmits<{
    'update:modelValue': [value: { text: string; author?: string; tags?: string[] }]
    submit: [value: { text: string; author?: string; tags?: string[] }]
    cancel: []
  }>()
  
  // イベントを発火
  emit('submit', formValue)  // ✅ 正しい型で発火
  emit('cancel')              // ✅ 引数なしで発火
  emit('submit', 'invalid')  // ❌ 型エラー（文字列は受け付けない）
  ```
  
  **型定義の意味:**
  - `'update:modelValue': [value: {...}]` → `update:modelValue`イベントは1つの引数（value）を受け取る
  - `submit: [value: {...}]` → `submit`イベントは1つの引数（value）を受け取る
  - `cancel: []` → `cancel`イベントは引数を受け取らない
  
  **型安全性のメリット:**
  1. **コンパイル時チェック**: 間違った型でイベントを発火すると、TypeScriptがエラーを出す
  2. **IDE補完**: イベント名や引数の型が自動補完される
  3. **ドキュメント化**: コードを見るだけで、どのイベントがどの引数を受け取るかが分かる
  
  **実際の使用例:**
  ```typescript
  // 子コンポーネント（QuoteForm.vue）で定義
  const emit = defineEmits<{
    submit: [value: { text: string; author?: string; tags?: string[] }]
    cancel: []
  }>()
  
  // イベントを発火
  function handleSubmit() {
    emit('submit', formValue)  // フォームの値のみを親に渡す
  }
  
  function handleCancel() {
    emit('cancel')  // 引数なしでキャンセルを通知
  }
  ```
  
  ```vue
  <!-- 親コンポーネント（quotes.vue）で受け取る -->
  <QuoteForm
    @submit="handleSubmit"    <!-- フォームの値を受け取る -->
    @cancel="cancelForm"       <!-- キャンセルを処理 -->
  />
  
  <script setup>
  // 親側でイベントを処理
  function handleSubmit(formValue: { text: string; author?: string; tags?: string[] }) {
    // formValueのみを受け取り、ビジネスロジックを実行
    if (editingQuote.value) {
      updateQuote(editingQuote.value.id, formValue)
    } else {
      addQuote(formValue)
    }
  }
  </script>
  ```
  
  **Vue 2との違い:**
  - Vue 2では`this.$emit('eventName', value)`を使用（Options API）
  - Vue 3では`defineEmits`で型安全に定義し、`emit('eventName', value)`で発火（Composition API）
  - TypeScriptの型チェックにより、より安全にイベントを扱える

  **`defineEmits`は必須なのか？定義していないイベントは発火できないのか？**
  
  **答え: `defineEmits`は必須ではない。定義していなくても`emit`は使える。**
  
  ただし、型安全性とIDE補完のため、`defineEmits`を使うことを強く推奨する。
  
  **実際の動作:**
  ```typescript
  // defineEmitsを定義しなくても、emitは使える
  // ただし、型チェックが効かない
  emit('submit', formValue)  // ✅ 動作する
  emit('cancel')             // ✅ 動作する
  emit('undefinedEvent')     // ✅ 動作する（型エラーにならない）
  ```
  
  
  ```typescript
  // defineEmitsを定義した場合
  const emit = defineEmits<{
    submit: [value: { text: string }]
    cancel: []
  }>()
  
  emit('submit', formValue)  // ✅ 正しい型で発火
  emit('cancel')             // ✅ 正しい
  emit('undefinedEvent')     // ❌ 型エラー（定義していないイベント）
  ```
  
  **違いのまとめ:**
  
  | 項目 | `defineEmits`なし | `defineEmits`あり |
  |------|------------------|------------------|
  | emitできるか | ✅ できる | ✅ できる |
  | 型チェック | ❌ なし | ✅ あり |
  | IDE補完 | ❌ なし | ✅ あり |
  | 実行時エラー | 発見しにくい | コンパイル時に発見 |
  | ドキュメント化 | 不明確 | 明確 |
  
  **まとめ:**
  - `defineEmits`は必須ではない（定義していなくても`emit`は使える）
  - 定義していないイベントも発火できるが、型エラーになる（型安全性のため）
  - TypeScriptを使う場合は`defineEmits`で型定義することを強く推奨する
  - `defineEmits`は「ルール」ではなく「ベストプラクティス」である

  **「valueのみを親に投げる」のアンチパターン:**
  
  **❌ アンチパターン例:**
  1. 子コンポーネントでビジネスロジックを実行（`addQuote`/`updateQuote`を子で呼ぶ）
  2. value以外の情報も一緒に渡す（`isEdit`、`quoteId`など親が既に知っている情報）
  3. 子コンポーネントでAPI呼び出しを行う
  4. イベント名で登録/更新を区別する（`@create`と`@update`を分ける）
  
  **✅ 正しいパターン:**
  - 子は`emit('submit', formValue)`でvalueのみを親に渡す
  - 親が`@submit`イベントを受け取り、ビジネスロジック（登録/更新の判定、API呼び出し）を実行
  - 関心の分離を保ち、子コンポーネントを再利用可能にする

**実装ファイル:**
- `components/QuoteForm.vue`: 共通フォームコンポーネント
- `pages/quotes.vue`: 親コンポーネント（登録・編集画面）

- ・各ライフサイクルフックの中でコンポーネントに必要な処理を定義する事ができる

  **実装内容:**
  - `onMounted`でタイマーとイベントリスナーを設定
  - `onBeforeUnmount`でタイマーとイベントリスナーのクリーンアップ
  - 10秒ごとに名言を自動切り替えする機能を実装

  **技術的なポイント:**
  - `setInterval`でタイマーを開始し、10秒ごとに`pickNext()`を自動実行
  - `onMounted`で1回だけ`startAutoRotate()`を呼び、その後は`setInterval`が自動で繰り返し実行
  - `onBeforeUnmount`で`clearInterval`を呼び、タイマーIDをクリアしてメモリリークを防止
  - `visibilitychange`イベントでタブの表示/非表示を監視し、非表示時はタイマーを停止

  **タイマーの動作フロー:**
  1. `onMounted`で`startAutoRotate()`を1回だけ呼ぶ
  2. `setInterval`で10秒ごとに`pickNext()`が自動実行される
  3. `pickNext()`が呼ばれるたびに`salt`を増やして名言を入れ替える
  4. ページ遷移時などに`onBeforeUnmount`が呼ばれる
  5. `stopAutoRotate()`でタイマーを停止し、リソースを解放

  **重要なポイント:**
  - `onBeforeUnmount`は名言の入れ替わり自体には直接関与しない
  - 入れ替わりは`setInterval`と`pickNext()`が行う
  - `onBeforeUnmount`の役割は、タイマーIDとイベントリスナーのクリーンアップ（後始末）
  - クリーンアップを忘れると、ページを離れてもタイマーが動き続けてメモリリークが発生する

  **役割の分離:**
  
  | 処理 | 役割 | 実行タイミング |
  |------|------|----------------|
  | `startAutoRotate()` | タイマーを開始して入れ替えを開始 | `onMounted`で1回 |
  | `setInterval` | 10秒ごとに`pickNext()`を自動実行 | 開始後、自動で繰り返し |
  | `pickNext()` | 名言を入れ替える | 10秒ごとに自動実行 |
  | `onBeforeUnmount` | タイマーIDとイベントリスナーをクリーンアップ | ページ遷移時などに1回 |

  **なぜonBeforeUnmountでクリーンアップするのが最適か:**
  - タイミング: アンマウント直前に走るため、破棄処理中の不要なコールバック発火を抑止できる
  - 参照の有効性: DOMやハンドラ参照が生きているタイミングで`clearInterval`や`removeEventListener`を安全に呼べる
  - 副作用の抑止: タイマーやグローバルリスナーが残存して二重発火・メモリリークを起こすのを防げる
  - 補足: `onUnmounted`でも後始末は可能だが、DOMが外れた後であり、直前の副作用抑止という観点では`onBeforeUnmount`が望ましい


- コンポーネント内のロジックをcomposableに切り出して定義する事ができる

  **Composableとは:**
  - Vue 3のComposition APIで、再利用可能なロジックを関数として切り出したもの
  - `use`で始まる関数名（慣習）
  - コンポーネントから独立したロジックを`composables/useXXX.ts`に定義

  **実装内容:**
  - `composables/useSeededRandom.ts`で状態を持たない処理（シード値からランダムに選ぶ）を切り出し
  - `pages/index.vue`で`useSeededRandom()`を呼び出して使用
  - コンポーネント側は`const random = useSeededRandom(...)`で呼び出すだけ

  **技術的なポイント:**
  - 状態を持たない処理をcomposableに切り出すことで、再利用性とテスト容易性が向上
    - ちなみに状態をもつ、ってのはStoreから状態を取得したりする処理のこと（Storeなどの外部の状態に依存している処理）
    - useSeededRandomは外部の状態に依存せず、引数から結果を返すだけなので「状態を持たない処理」
  - コンポーネントがシンプルになり、関心の分離が実現される
  - Nuxt 3では`composables/`配下のファイルは自動的にインポートされる

  **メリット:**
  - 複数のコンポーネントで同じロジックを再利用できる
  - コンポーネントがシンプルになる
  - ロジックを独立してテストできる
  - 関心の分離が実現される

- pinia
  - state, Actions, Gettersを含むのが一般的

  **Piniaのメリット:**
  1. **状態管理とデータ操作の一体化**: 1つの関数でデータ操作と状態更新を管理できる
  2. **複数コンポーネントで状態を共有**: 1つのストアを複数のコンポーネントから使用でき、状態が自動的に同期される
  3. **リアクティビティの自動更新**: 状態が変わると自動的にUIが更新される
  4. **エラーハンドリングの一元管理**: すべてのCRUD操作で統一されたエラー処理とローディング状態を管理できる
  5. **型安全性**: TypeScriptで型チェックができる
  6. **テストしやすい**: ストアを直接テストできる

  **永続化の実装: 良い例 vs 悪い例**

  **✅ 良い例: ライブラリ（pinia-plugin-persistedstate）を使う**

  ```typescript
  // stores/quotes.ts
  export const useQuotesStore = defineStore('quotes', () => {
    const quotes = ref<Quote[]>([])
    // ...
    return { quotes }
  }, {
    persist: {
      pick: ['quotes'],  // quotesのみを永続化
    },
  })
  ```

  **メリット:**
  - シンプル: 設定だけで永続化できる
  - 自動化: 保存・復元が自動的に行われる
  - 柔軟性: `pick`で永続化するプロパティを選択可能
  - 保守性: ライブラリが更新・修正を担当
  - 型安全: TypeScriptと相性が良い

  **❌ 悪い例: localStorageに直接アクセスする**

  ```typescript
  // ❌ 悪い例：localStorageに直接アクセス
  export const useQuotesStore = defineStore('quotes', () => {
    // 初期化時にlocalStorageから読み込む
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem('quotes')
        return stored ? JSON.parse(stored) : []
      } catch (error) {
        console.error('Failed to load from storage:', error)
        return []
      }
    }
    
    const quotes = ref<Quote[]>(loadFromStorage())
    
    // quotesが変更されるたびにlocalStorageに保存
    watch(quotes, (newQuotes) => {
      try {
        localStorage.setItem('quotes', JSON.stringify(newQuotes))
      } catch (error) {
        console.error('Failed to save to storage:', error)
      }
    }, { deep: true })
    
    return { quotes }
  })
  ```

  **デメリット:**
  
  1. **コードが複雑: 手動で保存・復元を実装する必要がある**
     - 初期化時にlocalStorageから読み込む関数（`loadFromStorage()`）を実装する必要がある
     - 状態が変更されるたびに保存するために`watch`で深い監視（`{ deep: true }`）が必要
     - SSR（サーバーサイドレンダリング）対応のために`typeof window === 'undefined'`のチェックが必要
     - ライブラリを使えば設定だけで済むが、直接アクセスではすべて自分で実装する必要がある
  
  2. **エラーハンドリングが必要: 各所でtry-catchが必要**
     - `loadFromStorage()`で`JSON.parse()`が失敗する可能性があるため、try-catchが必要
     - `watch`内の`localStorage.setItem()`も容量制限などで失敗する可能性があるため、try-catchが必要
     - エラーハンドリングのロジックが各所に分散し、一貫性を保ちにくい
     - ライブラリを使えば、エラーハンドリングはライブラリが自動的に処理してくれる
  
  3. **保守性が低い: 変更時に複数箇所を修正する必要がある**
     - ストレージキー名を変更する場合、`loadFromStorage()`と`watch`内の両方を修正する必要がある
     - 永続化するプロパティを追加・削除する場合、`watch`の条件を変更する必要がある
     - エラーハンドリングの方法を変更する場合、各所のtry-catchを修正する必要がある
     - ライブラリを使えば、設定を変更するだけで済む
  
  4. **バグのリスク: 手動実装で見落としが起きやすい**
     - `watch`に`{ deep: true }`を付け忘れると、配列の中身が変わっても保存されない
     - SSR対応を忘れると、サーバー側でエラーが発生する
     - 初期化のタイミングを間違えると、他のコンポーネントが空の状態を参照してしまう
     - クリーンアップを忘れると、メモリリークが発生する可能性がある
     - ライブラリを使えば、これらの問題はライブラリが解決してくれる
  
  5. **機能が限定的: 選択的永続化などは自前実装が必要**
     - `quotes`だけを永続化し、`isLoading`や`error`は永続化しない場合、条件分岐が必要
     - 複数のストアで異なる永続化設定を使う場合、それぞれに実装が必要
     - 永続化のタイミングを制御したい場合（例：一定時間後に保存）、自前で実装が必要
     - ライブラリを使えば、`pick`オプションで簡単に選択的永続化ができる

  **このプロジェクトでの実装:**
  - `plugins/pinia-persistedstate.client.ts`でプラグインを設定
  - `stores/quotes.ts`で`persist`オプションを使用
  - `pick: ['quotes']`で`quotes`のみを永続化（`isLoading`、`error`は永続化しない）

- シンプルなルーティングを設定できる

  **ルーティングとは:**
  - ルーティングとは、URL（アドレスバーのパス）と表示するページを対応付ける仕組みです
  - 例：`/quotes`というURLにアクセスすると、名言一覧ページが表示される
  - これにより、ユーザーはURLを直接入力したり、ブックマークしたりできます

  **Nuxt.jsのファイルベースルーティング:**
  - Nuxt.jsでは、**ファイル構造がそのままルーティングになる**という特徴があります
  - `pages/`ディレクトリ内のファイル構造が自動的にURLパスに変換されます
  - 特別な設定ファイルは不要（自動的にルーティングが生成される）
  - これにより、直感的で分かりやすいルーティングが実現できます

  **基本的なルーティングの仕組み:**
  ```
  ファイル構造                    →  URL
  ──────────────────────────────────────────
  pages/index.vue                →  /
  pages/quotes.vue               →  /quotes
  pages/authors/index.vue        →  /authors
  ```

  **実装内容:**
  - `pages/index.vue` → `/`（トップページ）
  - `pages/quotes.vue` → `/quotes`（名言一覧ページ）
  - `pages/authors/index.vue` → `/authors`（著者一覧ページ）

  **`index.vue`の特別な役割:**
  - `index.vue`は**特別なファイル名**で、URLには表示されません
  - `pages/index.vue` → `/`（`index`という文字列はURLに含まれない）
  - `pages/authors/index.vue` → `/authors`（`index`という文字列はURLに含まれない）
  - 一方、`quotes.vue` → `/quotes`（ファイル名がそのままURLになる）

  **なぜ`index.vue`が特別なのか:**
  - `index`は「そのディレクトリのデフォルトページ」を表す慣習的な名前
  - Webサーバーでも`index.html`がデフォルトページとして扱われるのと同じ考え方
  - これにより、ディレクトリ名だけでアクセスできる（`/authors`で`/authors/index`にアクセスできる）

  **ファイル名とURLの対応関係:**
  ```
  ファイル名              →  URL
  ──────────────────────────────────────────
  index.vue              →  /（親ディレクトリのルート）
  quotes.vue             →  /quotes（ファイル名がそのままURL）
  authors/index.vue      →  /authors（親ディレクトリのルート）
  authors/profile.vue    →  /authors/profile（ファイル名がそのままURL）
  ```

  **技術的なポイント:**
  - Nuxt 3では`pages/`配下の`.vue`ファイルが自動的にルートとして認識される
  - `index.vue`は親ディレクトリのルートになる（`pages/authors/index.vue` → `/authors`）
  - `index.vue`以外のファイル名は、そのままURLパスになる
  - `NuxtLink`コンポーネントでページ間のナビゲーションを実装

  **基本的な使い方:**
  ```vue
  <!-- NuxtLinkでページ遷移 -->
  <NuxtLink to="/quotes">名言一覧</NuxtLink>
  <NuxtLink to="/authors">著者一覧</NuxtLink>
  ```

  **NuxtLinkとは:**
  - HTMLの`<a>`タグの代わりに使用するNuxt.jsのコンポーネント
  - ページ遷移が高速（SPAのため、ページ全体を再読み込みしない）
  - `to`属性で遷移先のURLを指定

- 動的ルートマッチが定義できる

  **動的ルートとは:**
  - 動的ルートとは、URLの一部が変わるルーティングのことです
  - 例：`/quotes/123`、`/quotes/456`のように、名言のIDが変わる
  - 固定のURL（`/quotes`）ではなく、可変部分（`123`、`456`）を含むURL
  - これにより、1つのページコンポーネントで複数のデータを表示できます

  **なぜ動的ルートが必要か:**
  - 名言が100個ある場合、100個のページファイルを作るのは非効率
  - 動的ルートを使えば、1つのファイル（`[id].vue`）で全ての名言を表示できる
  - URLからIDを取得して、そのIDに対応するデータを表示する

  **実装内容:**
  - `pages/quotes/[id].vue` → `/quotes/:id`（個別名言の詳細ページ）
  - `route.params.id`で動的パラメータを取得
  - 例：`/quotes/abc123`にアクセスすると、`route.params.id`は`"abc123"`になる

  **ファイル構造とURLの対応:**
  ```
  ファイル構造                    →  URL例
  ──────────────────────────────────────────
  pages/quotes/[id].vue          →  /quotes/abc123
                                   /quotes/xyz789
                                   /quotes/任意のID
  ```

  **技術的なポイント:**
  - ファイル名を`[id].vue`のように角括弧`[]`で囲むと、動的ルートになる
  - `[id]`の`id`はパラメータ名で、`route.params.id`で取得できる
  - `useRoute()`で現在のルート情報（パラメータ、クエリ、パスなど）を取得
  - `useRouter()`でプログラムからページ遷移（`router.push()`など）ができる

  **実際の使用例:**
  ```vue
  <!-- pages/quotes/[id].vue -->
  <template>
    <div>
      <h1>名言の詳細</h1>
      <p>ID: {{ quoteId }}</p>
      <!-- このIDを使ってデータを取得・表示 -->
    </div>
  </template>

  <script setup>
  const route = useRoute()
  const router = useRouter()
  
  // 動的パラメータを取得
  // /quotes/abc123 にアクセスした場合、quoteId は "abc123" になる
  const quoteId = computed(() => route.params.id as string)
  
  // プログラムから遷移（ボタンクリックなどで使用）
  function goBack() {
    router.push('/quotes')  // 名言一覧ページに戻る
  }
  </script>
  ```

  **なぜ`[id]`という記法なのか:**
  - Nuxt.jsの標準的な命名規則で、角括弧`[]`が動的パラメータを表す
  - この記法は変更できない（Nuxt.jsの仕様）
  - 多くのプロジェクトで使用されている標準的な記法
  - `[id]`の`id`は任意の名前（`[userId]`、`[postId]`など）に変更可能

  **動的ルートのマッチング:**
  - `[id].vue` → 任意の文字列にマッチ（例：`/quotes/123`、`/quotes/abc`）
  - `[id]`はパラメータ名で、`route.params.id`で取得できる
  - 複数の動的パラメータも可能（例：`[userId]/[postId].vue` → `/users/123/posts/456`）

  **初心者向けの理解:**
  - `[id]`は「ここに何かが入る」というプレースホルダー（置き換え可能な部分）
  - 実際のURLでは、`[id]`の部分が具体的な値（例：`abc123`）に置き換わる
  - その値は`route.params.id`で取得できる

- ネストされたルーティングの定義ができる

  **ネストされたルーティングとは:**
  - ネスト（入れ子）されたルーティングとは、親子関係のあるリソースを表現するルーティングです
  - 例：`/authors/123/quotes` → 「著者123の名言一覧」という意味
  - ディレクトリ構造でネストを表現する（ディレクトリの中にディレクトリを作る）
  - 例：`user` → `posts`のようにhas_manyな関係（1対多の関係）を表現

  **なぜネストされたルーティングが必要か:**
  - リソースの階層関係をURLで表現できる
  - 例：「著者」という親リソースと、「その著者の名言」という子リソース
  - URLが直感的で、何を表示しているかが分かりやすい

  **実装内容:**
  - `pages/authors/[id]/quotes.vue` → `/authors/:id/quotes`（特定著者の名言一覧）
  - URL形式：`/authors/{著者ID}/quotes`
  - 例：`/authors/01ARZ3NDEKTSV4RRFFQ69G5FAV/quotes`にアクセスすると、その著者の名言一覧が表示される
  - このプロジェクトでは、IDベースの設計を採用（著者IDを使用）

  **技術的なポイント:**
  - ディレクトリ構造がそのままURLパスになる
  - `pages/authors/[id]/quotes.vue`は以下の構造を表す：
    - `/authors` → 著者一覧
    - `/authors/:id` → 特定の著者（動的パラメータ、実際の値は著者ID）
    - `/authors/:id/quotes` → その著者の名言一覧（ネストされたルート）

  **実際の使用例:**
  ```vue
  <!-- pages/authors/[id]/quotes.vue -->
  <script setup>
  const route = useRoute()
  const { quotes, loadQuotes } = useQuotes()
  const { getAuthor, loadAuthors } = useAuthors()
  
  // 動的パラメータから著者IDを取得
  // /authors/01ARZ3NDEKTSV4RRFFQ69G5FAV/quotes にアクセスした場合
  const authorId = computed(() => route.params.id as string)
  
  // 著者情報を取得
  const author = computed(() => getAuthor(authorId.value))
  const authorName = computed(() => author.value?.name || '不明な著者')
  
  // 著者IDでフィルタリング
  const authorQuotes = computed(() => {
    return quotes.value.filter(
      (quote) => quote.authorId === authorId.value
    )
  })
  
  onMounted(async () => {
    await Promise.all([loadQuotes(), loadAuthors()])
  })
  </script>
  ```

  **ネストされたルーティングの構造:**
  ```
  pages/
    └── authors/
        ├── index.vue              → /authors（著者一覧）
        └── [id]/
            └── quotes.vue         → /authors/:id/quotes（その著者の名言一覧）
  ```

  **初心者向けの理解:**
  - ディレクトリ構造がそのままURLになる
  - `authors/[id]/quotes.vue` → `/authors/{ID}/quotes`というURLになる
  - `[id]`の部分は動的パラメータで、実際の著者IDに置き換わる
  - これにより、「著者Aの名言一覧」「著者Bの名言一覧」を1つのファイルで表示できる

  **IDベース設計のメリット（このプロジェクト）:**
  - 著者IDはUUID（例：`01ARZ3NDEKTSV4RRFFQ69G5FAV`）なので、エンコーディング不要
  - 特殊文字を含まないため、URLがシンプル
  - 著者名が変更されてもURLが変わらない（安定性）

  **CRUD画面のルーティング設計例:**
  ```
  pages/
    └── quotes/
        ├── index.vue          → /quotes（一覧）
        ├── [id].vue           → /quotes/:id（詳細）
        └── [id]/
            └── edit.vue       → /quotes/:id/edit（編集）
  ```

  **has_many関係のネストルーティング設計例:**
  ```
  pages/
    └── authors/
        ├── index.vue          → /authors（著者一覧）
        └── [id]/
            └── quotes.vue     → /authors/:id/quotes（その著者の名言一覧）
  ```
  
  **パラメータ名の命名規則:**
  - 動的パラメータの名前は、実際の値の意味を表すべき
  - 例：`[id]`はID（数値やUUID）を表す場合に使用
  - 例：`[name]`は名前（文字列）を表す場合に使用
  - このプロジェクトでは、著者IDをパラメータとして使用するため`[id]`を使用

  **URL設計の選択肢: ID vs 名前（スラッグ）**
  
  一般的なRESTful APIの設計では、以下の2つのパターンがあります：
  
  **1. IDを使う場合（このプロジェクトで採用）**
  ```
  /authors/01ARZ3NDEKTSV4RRFFQ69G5FAV/quotes  → UUID
  ```
  
  **メリット:**
  - 名前が変更されてもURLが変わらない（安定性）
  - 特殊文字のエンコーディングが不要
  - データベースの主キーと直接対応できる
  - 一般的なRESTful設計パターン
  - 同名の著者がいても問題ない
  
  **デメリット:**
  - 人間が読めない（IDだけでは何を表すか分からない）
  - SEOには不利（検索エンジンが内容を理解しにくい）
  
  **2. 名前（スラッグ）を使う場合**
  ```
  /authors/mark-twain/quotes     → 英語のスラッグ
  /authors/マーク・トウェイン/quotes → 日本語の名前
  ```
  
  **メリット:**
  - SEOに有利（URLから内容が分かる）
  - 人間が読める、共有しやすい
  - URLが直感的
  
  **デメリット:**
  - 名前が変更されるとURLが変わる（ブックマークが無効になる）
  - 日本語などの特殊文字はエンコーディングが必要（`encodeURIComponent()`）
  - 同名の著者がいる場合の処理が必要
  
  **3. このプロジェクトでの選択**
  
  このプロジェクトでは、**IDベースの設計を採用**しています：
  - `/authors/{著者ID}/quotes`
  - 例：`/authors/01ARZ3NDEKTSV4RRFFQ69G5FAV/quotes`
  
  **選択理由:**
  - 著者名が変更されてもURLが変わらない（安定性）
  - 特殊文字のエンコーディングが不要
  - データベースの主キーと直接対応できる
  - 一般的なRESTful設計パターンに準拠
  
  **実装の流れ:**
  1. `Author`型を追加し、著者にIDを付与
  2. `Quote`型に`authorId`フィールドを追加
  3. URLを`/authors/:id/quotes`に変更
  4. 既存データの移行処理を実装

  **メリット:**
  - URLが直感的で、リソースの階層関係が明確になる
  - RESTfulな設計になり、SEOにも有利
  - ブックマークや共有がしやすい
  - ブラウザの戻る/進むボタンが正しく動作する

  **実装ファイル:**
  - `pages/quotes/[id].vue`: 個別名言の詳細ページ（動的ルート、IDを使用）
  - `pages/authors/index.vue`: 著者一覧ページ
  - `pages/authors/[id]/quotes.vue`: 特定著者の名言一覧（ネストされたルーティング、著者IDを使用）

  **NuxtLinkでの使用例:**
  ```vue
  <!-- 動的ルートへのリンク -->
  <NuxtLink :to="`/quotes/${quote.id}`">詳細</NuxtLink>
  
  <!-- ネストされたルートへのリンク（IDベース） -->
  <NuxtLink :to="`/authors/${author.id}/quotes`">
    この著者の名言一覧
  </NuxtLink>
  
  <!-- クエリパラメータ付きのリンク -->
  <NuxtLink :to="{ path: '/quotes', query: { page: 1 } }">
    名言一覧（1ページ目）
  </NuxtLink>
  ```

  **初心者向けの理解:**
  - `:to`の前に`:`（コロン）を付けると、JavaScriptの式として評価される
  - `:to="'/quotes'"` → 文字列リテラル（固定のURL）
  - `:to="`/quotes/${quote.id}`"` → テンプレートリテラル（変数を埋め込む）
  - `:to="{ path: '/quotes', query: { page: 1 } }"` → オブジェクト形式（クエリパラメータ付き）

  **useRoute()とuseRouter()の違い:**
  
  | 関数 | 用途 | 主な機能 |
  |------|------|----------|
  | `useRoute()` | 現在のルート情報を取得 | `route.params`、`route.query`、`route.path`など |
  | `useRouter()` | プログラムからページ遷移 | `router.push()`、`router.replace()`、`router.go()`など |
  
  **useRoute()の主なプロパティ:**
  ```typescript
  const route = useRoute()
  
  // 動的パラメータ（URLの一部として含まれる値）
  // 例：/quotes/abc123 → route.params.id は "abc123"
  route.params      // { id: 'abc123' }
  
  // クエリパラメータ（URLの?以降の値）
  // 例：/quotes?page=1&sort=desc → route.query は { page: '1', sort: 'desc' }
  route.query       // { page: '1', sort: 'desc' }
  
  // 現在のパス（URLのパス部分）
  route.path        // '/quotes/abc123'
  
  // ルート名（ファイルベースルーティングでは自動生成）
  route.name        // 'quotes-id'
  
  // ルートのメタ情報（カスタムデータ）
  route.meta        // {}
  ```
  
  **useRouter()の主なメソッド:**
  ```typescript
  const router = useRouter()
  
  // ページ遷移（履歴に残る）
  router.push('/quotes')
  
  // クエリパラメータ付きで遷移
  router.push({ path: '/quotes', query: { page: 1 } })
  
  // 履歴を残さずに遷移（戻るボタンで戻れない）
  router.replace('/quotes')
  
  // ブラウザの戻る（-1で1つ戻る）
  router.go(-1)
  
  // ブラウザの進む（1で1つ進む）
  router.go(1)
  ```

  **初心者向けの理解:**
  - `useRoute()`は「現在のページの情報を取得する」ための関数
  - `useRouter()`は「ページを移動する」ための関数
  - `route.params`はURLの一部として含まれる値（例：`/quotes/123`の`123`）
  - `route.query`はURLの`?`以降の値（例：`/quotes?page=1`の`page=1`）
  - `router.push()`はリンクをクリックした時と同じ動作（履歴に残る）
  - `router.replace()`は現在のページを置き換える（履歴に残らない）

  **実際の使用例:**
  ```vue
  <script setup>
  const route = useRoute()
  const router = useRouter()
  
  // URLからIDを取得
  // /quotes/abc123 にアクセスした場合
  const quoteId = route.params.id  // "abc123"
  
  // ボタンクリックでページ遷移
  function goToQuotes() {
    router.push('/quotes')
  }
  
  // 検索結果ページに遷移（クエリパラメータ付き）
  function searchQuotes(keyword: string) {
    router.push({
      path: '/quotes',
      query: { search: keyword }
    })
    // → /quotes?search=成功 というURLになる
  }
  </script>
  ```


**自分的によく学んどいた方がいいと思うこと**
- Vue2とVue3の大きな違いは？
- そもそもTypeScriptがいいってなってるのはなんでなの？
- Vue3のライフサイクルフック
  - Vue2との違いは？
  - 各ライフサイクルフックで入れるべき処理で代表的なもの