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


**自分的によく学んどいた方がいいと思うこと**
- Vue2とVue3の大きな違いは？
- そもそもTypeScriptがいいってなってるのはなんでなの？
- Vue3のライフサイクルフック
  - Vue2との違いは？
  - 各ライフサイクルフックで入れるべき処理で代表的なもの