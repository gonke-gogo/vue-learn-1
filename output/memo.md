- 処理の流れ
  ┌─────────────────────────────────────────┐
  │ 1. ブラウザ（UI） │
  │ ユーザーがフォームに入力して送信 │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 2. pages/quotes.vue │
  │ handleSubmit() │
  │ → addQuote(formValue) │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 3. composables/useQuotes.ts │
  │ useQuotes() │
  │ → store.addQuote │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 4. stores/quotes.ts │
  │ useQuotesStore.addQuote() │
  │ → repository.add(quote) │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 5. repositories/factory.ts │
  │ createQuoteRepository() │
  │ → new LocalQuoteRepository() │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 6. repositories/LocalQuoteRepository.ts│
  │ add() │
  │ → getQuotes() │
  │ → 新しい名言オブジェクト作成 │
  │ → saveQuotes(quotes) │
  └──────────────┬──────────────────────────┘
  ↓
  ┌─────────────────────────────────────────┐
  │ 7. repositories/LocalQuoteRepository.ts│
  │ saveQuotes() │
  │ → localStorage.setItem() │
  └─────────────────────────────────────────┘

- Props / Event / Modelを使ってコンポーネントを実装する事ができる

  **実装内容:**
  - `components/QuoteForm.vue`を作成し、共通フォームコンポーネントとして実装
  - Props定義: `modelValue`（フォームの値）、`isEditMode`（編集モード判定）、`isLoading`（ローディング状態）
  - Event定義: `update:modelValue`（双方向バインディング用）、`submit`（サブミット時）、`cancel`（キャンセル時）
  - `pages/quotes.vue`で`QuoteForm`コンポーネントを使用し、登録・編集の両方で共通化

  **技術的なポイント:**
  - Vue 3のComposition API（`<script setup>`）を使用する
  - TypeScriptで型安全性を確保する（`defineProps<Props>()`、`defineEmits<{}>()`）
  - Nuxt 3の自動インポート機能により、`components/`配下のコンポーネントは自動的にインポートされる

- 双方向バインディングを理解して正しく使う事ができる

  **実装内容:**
  - `v-model="form"`を使用して親子コンポーネント間で双方向バインディングを実装
  - 子コンポーネント（`QuoteForm`）で`modelValue`プロップを受け取り、`update:modelValue`イベントで親の値を更新
  - 各入力フィールド（text, author, tags）の変更を`update:modelValue`イベントで親に通知

  **技術的なポイント:**
  - Vue 3の`v-model`は`modelValue`プロップと`update:modelValue`イベントの組み合わせである
  - オブジェクト全体を`v-model`でバインドすることで、複数のフィールドを一度に管理できる
  - タグ入力はカンマ区切りの文字列として扱い、内部で配列に変換してから親に渡す

  **`v-model`の仕組み（なぜ`modelValue`に自動的に渡されるのか）:**

  `v-model="form"`は、Vue 3の糖衣構文（シンタックスシュガー）だ。以下の2つの省略形である：

  ```vue
  <!-- これが -->
  <QuoteForm v-model="form" />

  <!-- 実際にはこういう意味 -->
  <QuoteForm :modelValue="form" @update:modelValue="form = $event" />
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
  - Vue 3では`defineEmits`でイベントを型安全に定義する
  - サブミット時はフォームの値（`formValue`）のみを親に渡し、親側で`addQuote`/`updateQuote`を実行する
  - 子コンポーネントはビジネスロジックを持たず、純粋にフォームの表示と値の管理のみを担当する（関心の分離）

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
  emit('submit', formValue) // ✅ 正しい型で発火
  emit('cancel') // ✅ 引数なしで発火
  emit('submit', 'invalid') // ❌ 型エラー（文字列は受け付けない）
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
    emit('submit', formValue) // フォームの値のみを親に渡す
  }

  function handleCancel() {
    emit('cancel') // 引数なしでキャンセルを通知
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
  emit('submit', formValue) // ✅ 動作する
  emit('cancel') // ✅ 動作する
  emit('undefinedEvent') // ✅ 動作する（型エラーにならない）
  ```

  ```typescript
  // defineEmitsを定義した場合
  const emit = defineEmits<{
    submit: [value: { text: string }]
    cancel: []
  }>()

  emit('submit', formValue) // ✅ 正しい型で発火
  emit('cancel') // ✅ 正しい
  emit('undefinedEvent') // ❌ 型エラー（定義していないイベント）
  ```

  **違いのまとめ:**

  | 項目           | `defineEmits`なし | `defineEmits`あり  |
  | -------------- | ----------------- | ------------------ |
  | emitできるか   | ✅ できる         | ✅ できる          |
  | 型チェック     | ❌ なし           | ✅ あり            |
  | IDE補完        | ❌ なし           | ✅ あり            |
  | 実行時エラー   | 発見しにくい      | コンパイル時に発見 |
  | ドキュメント化 | 不明確            | 明確               |

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

  | 処理                | 役割                                         | 実行タイミング         |
  | ------------------- | -------------------------------------------- | ---------------------- |
  | `startAutoRotate()` | タイマーを開始して入れ替えを開始             | `onMounted`で1回       |
  | `setInterval`       | 10秒ごとに`pickNext()`を自動実行             | 開始後、自動で繰り返し |
  | `pickNext()`        | 名言を入れ替える                             | 10秒ごとに自動実行     |
  | `onBeforeUnmount`   | タイマーIDとイベントリスナーをクリーンアップ | ページ遷移時などに1回  |

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
  - 状態を持たない処理をcomposableに切り出すことで、再利用性とテスト容易性が向上する
    - ちなみに状態をもつ、ってのはStoreから状態を取得したりする処理のことだ（Storeなどの外部の状態に依存している処理）
    - useSeededRandomは外部の状態に依存せず、引数から結果を返すだけなので「状態を持たない処理」である
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
  export const useQuotesStore = defineStore(
    'quotes',
    () => {
      const quotes = ref<Quote[]>([])
      // ...
      return { quotes }
    },
    {
      persist: {
        pick: ['quotes'], // quotesのみを永続化
      },
    }
  )
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
    watch(
      quotes,
      (newQuotes) => {
        try {
          localStorage.setItem('quotes', JSON.stringify(newQuotes))
        } catch (error) {
          console.error('Failed to save to storage:', error)
        }
      },
      { deep: true }
    )

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

## シンプルなルーティングを設定できる

**ルーティングとは:**

- ルーティングとは、URL（アドレスバーのパス）と表示するページを対応付ける仕組みである
- 例：`/quotes`というURLにアクセスすると、名言一覧ページが表示される
- これにより、ユーザーはURLを直接入力したり、ブックマークしたりできる

**Nuxt.jsのファイルベースルーティング:**

- Nuxt.jsでは、**ファイル構造がそのままルーティングになる**という特徴がある
- `pages/`ディレクトリ内のファイル構造が自動的にURLパスに変換される
- 特別な設定ファイルは不要である（自動的にルーティングが生成される）
- これにより、直感的で分かりやすいルーティングが実現できる

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

- `index.vue`は**特別なファイル名**で、URLには表示されない
- `pages/index.vue` → `/`（`index`という文字列はURLに含まれない）
- `pages/authors/index.vue` → `/authors`（`index`という文字列はURLに含まれない）
- 一方、`quotes.vue` → `/quotes`（ファイル名がそのままURLになる）

**なぜ`index.vue`が特別なのか:**

- `index`は「そのディレクトリのデフォルトページ」を表す慣習的な名前である
- Webサーバーでも`index.html`がデフォルトページとして扱われるのと同じ考え方だ
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
- `NuxtLink`コンポーネントでページ間のナビゲーションを実装する

**基本的な使い方:**

```vue
<!-- NuxtLinkでページ遷移 -->
<NuxtLink to="/quotes">名言一覧</NuxtLink>
<NuxtLink to="/authors">著者一覧</NuxtLink>
```

**NuxtLinkとは:**

- HTMLの`<a>`タグの代わりに使用するNuxt.jsのコンポーネントである
- ページ遷移が高速だ（SPAのため、ページ全体を再読み込みしない）
- `to`属性で遷移先のURLを指定する

- 動的ルートマッチが定義できる

  **動的ルートとは:**
  - 動的ルートとは、URLの一部が変わるルーティングのことである
  - 例：`/quotes/123`、`/quotes/456`のように、名言のIDが変わる
  - 固定のURL（`/quotes`）ではなく、可変部分（`123`、`456`）を含むURLである
  - これにより、1つのページコンポーネントで複数のデータを表示できる

  **なぜ動的ルートが必要か:**
  - 名言が100個ある場合、100個のページファイルを作るのは非効率である
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
  - `useRoute()`で現在のルート情報（パラメータ、クエリ、パスなど）を取得する
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
  - この記法は変更できない（Nuxt.jsの仕様である）
  - 多くのプロジェクトで使用されている標準的な記法だ
  - `[id]`の`id`は任意の名前（`[userId]`、`[postId]`など）に変更可能である

  **動的ルートのマッチング:**
  - `[id].vue` → 任意の文字列にマッチする（例：`/quotes/123`、`/quotes/abc`）
  - `[id]`はパラメータ名で、`route.params.id`で取得できる
  - 複数の動的パラメータも可能である（例：`[userId]/[postId].vue` → `/users/123/posts/456`）

  **初心者向けの理解:**
  - `[id]`は「ここに何かが入る」というプレースホルダー（置き換え可能な部分）である
  - 実際のURLでは、`[id]`の部分が具体的な値（例：`abc123`）に置き換わる
  - その値は`route.params.id`で取得できる

- ネストされたルーティングの定義ができる

  **ネストされたルーティングとは:**
  - ネスト（入れ子）されたルーティングとは、親子関係のあるリソースを表現するルーティングである
  - 例：`/authors/123/quotes` → 「著者123の名言一覧」という意味である
  - ディレクトリ構造でネストを表現する（ディレクトリの中にディレクトリを作る）
  - 例：`user` → `posts`のようにhas_manyな関係（1対多の関係）を表現する

  **なぜネストされたルーティングが必要か:**
  - リソースの階層関係をURLで表現できる
  - 例：「著者」という親リソースと、「その著者の名言」という子リソースである
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
    - `/authors/:id/quotes` → その著者の名言一覧（ネストされたルート）である

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
  - 著者IDはUUID（例：`01ARZ3NDEKTSV4RRFFQ69G5FAV`）なので、エンコーディング不要である
  - 特殊文字を含まないため、URLがシンプルだ
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

  一般的なRESTful APIの設計では、以下の2つのパターンがある：

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

  このプロジェクトでは、**IDベースの設計を採用**している：
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
  - RESTfulな設計になり、SEOにも有利である
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
  - `:to="'/quotes'"` → 文字列リテラル（固定のURL）である
  - `:to="`/quotes/${quote.id}`"` → テンプレートリテラル（変数を埋め込む）である
  - `:to="{ path: '/quotes', query: { page: 1 } }"` → オブジェクト形式（クエリパラメータ付き）である

- catch all routeを実装する事ができる

  **Catch All Routeとは:**
  - Catch all routeとは、定義されていないすべてのパスにマッチするルーティングである
  - 例：`/unknown-page`、`/test/123/abc`など、存在しないパスにアクセスした時に表示されるページである
  - 404エラーページとして使用されることが多い

  **なぜCatch All Routeが必要か:**
  - 存在しないページにアクセスした時に、適切なエラーページを表示するため
  - ユーザーに分かりやすいエラーメッセージを提供するため
  - SEO対策として、正しいHTTPステータスコード（404）を返すため

  **実装内容:**
  - `pages/[...slug].vue` → すべての未定義パスにマッチするcatch all route
  - ファイル名の`[...slug]`の`...`（3つのドット）が「残りのすべてのパスセグメント」を意味する
  - より具体的なルートが優先されるため、定義されていないパスのみがこのルートにマッチする

  **ファイル名の意味:**

  ```
  ファイル名              →  マッチするURL例
  ──────────────────────────────────────────
  pages/[id].vue         →  /abc, /123（1つのセグメントのみ）
  pages/[...slug].vue    →  /abc, /abc/def, /abc/def/ghi
                            （0個以上の任意のセグメント）
  ```

  **ルーティングの優先順位:**

  ```
  優先順位（高い順）:
  1. 固定ルート          pages/quotes/index.vue  → /quotes
  2. 動的ルート          pages/quotes/[id].vue   → /quotes/123
  3. Catch All Route     pages/[...slug].vue     → その他すべて
  ```

  **技術的なポイント:**
  - `[...slug]`の`...`（3つのドット）は「残りのすべてのパスセグメントにマッチする」という意味
  - `route.params.slug`でパラメータを取得できる（配列として取得される）
  - より具体的なルートが優先されるため、定義されていないパスのみがマッチする

  **実装例:**

  ```vue
  <!-- pages/[...slug].vue -->
  <template>
    <div class="page">
      <div class="errorContainer">
        <h1 class="errorTitle">404</h1>
        <h2 class="errorSubtitle">ページが見つかりません</h2>
        <p class="errorMessage">
          お探しのページは存在しないか、移動または削除された可能性があります。
        </p>
        <div v-if="attemptedPath && attemptedPath !== '/'" class="attemptedPath">
          <p class="pathLabel">アクセスしようとしたパス:</p>
          <code class="pathValue">{{ attemptedPath }}</code>
        </div>
        <div class="actions">
          <NuxtLink to="/" class="button">ホームに戻る</NuxtLink>
          <NuxtLink to="/quotes" class="button buttonSecondary">名言一覧</NuxtLink>
          <NuxtLink to="/authors" class="button buttonSecondary">著者一覧</NuxtLink>
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  const route = useRoute()

  // catch all routeのパラメータを取得
  // slugは配列として取得される（例: ['path', 'to', 'page']）
  const slug = route.params.slug
  const attemptedPath = computed(() => {
    if (Array.isArray(slug)) {
      return '/' + slug.join('/')
    }
    return slug ? `/${slug}` : '/'
  })
  </script>
  ```

  **`route.params.slug`の動作:**
  - Catch all route `[...slug]`では、URLのパスセグメントが`/`で区切られて配列として取得される
  - `useRoute()`でルート情報を取得し、`route.params.slug`でパラメータを取得する

  | アクセスしたURL | `route.params.slug`の値 | 型         |
  | --------------- | ----------------------- | ---------- |
  | `/unknown`      | `['unknown']`           | `string[]` |
  | `/test/123`     | `['test', '123']`       | `string[]` |
  | `/a/b/c/d`      | `['a', 'b', 'c', 'd']`  | `string[]` |

  **`attemptedPath`の実装:**
  - `attemptedPath`は、ユーザーがアクセスしようとしたパスを表示するためのcomputedプロパティである
  - `slug`が配列の場合は`join('/')`で結合し、先頭に`/`を付けてパス文字列を生成する
  - テンプレートで`{{ attemptedPath }}`として表示することで、ユーザーにどのパスにアクセスしようとしたかを示せる

  **Catch All Routeの実装に必要なもの:**
  - **必須**: `pages/[...slug].vue`ファイルの存在（これだけでcatch all routeとして機能する）
  - **任意**: `attemptedPath`の実装（UX向上のため）
  - **任意**: HTTPステータスコード404の設定（SEO対策のため）

  **HTTPステータスコード404の設定:**
  - Nuxt 3では、`useRequestEvent()`と`setResponseStatus()`を使用してHTTPステータスコードを設定する
  - サーバーサイドでのみ実行されるため、`process.server`で条件分岐する

  ```typescript
  // 404ステータスコードを設定（SEO対策）
  // サーバーサイドでのみ実行される
  if (process.server) {
    const event = useRequestEvent()
    if (event) {
      setResponseStatus(event, 404)
    }
  }
  ```

  **検証ツールで404を確認する方法:**
  - ブラウザの開発者ツール（F12）を開く
  - Networkタブを開く
  - 直接URLを入力してアクセスする（例: `http://localhost:3000/unknown-page`）
  - または、ページをリロード（F5）
  - Networkタブで該当リクエストを確認し、Status列に`404`が表示される

  **重要なポイント:**
  - **クライアントサイドナビゲーション**: `<NuxtLink>`で遷移した場合、サーバーへのHTTPリクエストが発生しないため、HTTPステータスコードは表示されない
  - **サーバーサイドレンダリング**: 直接URL入力/リロードの場合、サーバーへのHTTPリクエストが発生するため、404が表示される
  - **Catch All Routeの実装は、`pages/[...slug].vue`ファイルだけで完結する**（追加の設定ファイルは不要）

  **実装ファイル:**
  - `pages/[...slug].vue`: Catch all routeの実装（404エラーページ）

  **初心者向けの理解:**
  - `[...slug]`は「残りのすべてのパス」にマッチする特別な記法である
  - より具体的なルートが優先されるため、未定義パスだけがここにマッチする
  - `route.params.slug`でアクセスされたパスを取得できる（配列として取得される）
  - `attemptedPath`は必須ではないが、UX向上のために実装することが推奨される

  **useRoute()とuseRouter()の違い:**

  | 関数          | 用途                     | 主な機能                                               |
  | ------------- | ------------------------ | ------------------------------------------------------ |
  | `useRoute()`  | 現在のルート情報を取得   | `route.params`、`route.query`、`route.path`など        |
  | `useRouter()` | プログラムからページ遷移 | `router.push()`、`router.replace()`、`router.go()`など |

  **useRoute()の主なプロパティ:**

  ```typescript
  const route = useRoute()

  // 動的パラメータ（URLの一部として含まれる値）
  // 例：/quotes/abc123 → route.params.id は "abc123"
  route.params // { id: 'abc123' }

  // クエリパラメータ（URLの?以降の値）
  // 例：/quotes?page=1&sort=desc → route.query は { page: '1', sort: 'desc' }
  route.query // { page: '1', sort: 'desc' }

  // 現在のパス（URLのパス部分）
  route.path // '/quotes/abc123'

  // ルート名（ファイルベースルーティングでは自動生成）
  route.name // 'quotes-id'

  // ルートのメタ情報（カスタムデータ）
  route.meta // {}
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
  - `useRoute()`は「現在のページの情報を取得する」ための関数である
  - `useRouter()`は「ページを移動する」ための関数である
  - `route.params`はURLの一部として含まれる値である（例：`/quotes/123`の`123`）
  - `route.query`はURLの`?`以降の値である（例：`/quotes?page=1`の`page=1`）
  - `router.push()`はリンクをクリックした時と同じ動作だ（履歴に残る）
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

- `ref`と`computed`の違いと使い分け

  **`ref`と`computed`とは:**
  - どちらもVue 3のリアクティビティシステムの一部である
  - 値が変わると、それを使っている画面が自動で更新される（リアクティビティ）
  - ただし、用途と動作が異なる

  **`ref`とは:**
  - 手動で値を変更するためのリアクティブな変数である
  - 自分自身の値が変わると、それを使っている画面が自動で更新される
  - 他の値の変更を監視して自分を更新する機能はない

  **`computed`とは:**
  - 他の値から自動計算されるリアクティブな値である
  - 依存する値が変わると、自動で再計算される
  - 他の値の変更を監視して自分を更新する機能がある

  **基本的な使い方:**

  ```typescript
  // ref: 手動で値を変更
  const count = ref(0)
  count.value = 1 // 手動で値を変更

  // computed: 他の値から自動計算
  const doubleCount = computed(() => count.value * 2)
  // count が変わると自動で doubleCount も更新される
  ```

  **`.value`が必要な理由:**
  - `<script>`内では、`ref`や`computed`で作成した値にアクセスする際は`.value`が必要である
  - `<template>`内では、`.value`は不要だ（自動的に展開される）

  ```typescript
  // <script>内
  const authorId = computed(() => route.params.id as string)
  console.log(authorId.value) // ✅ .value が必要

  // <template>内
  // {{ authorId }}  ← .value 不要（自動展開）
  ```

  **`ref`と`computed`の違い:**

  | 特徴                               | `ref`                              | `computed`                   |
  | ---------------------------------- | ---------------------------------- | ---------------------------- |
  | 用途                               | 手動で値を変更する                 | 他の値から自動計算する       |
  | 更新方法                           | 手動で`.value`を設定               | 依存する値が変わると自動更新 |
  | `watch`                            | 必要（他の値の変更を監視する場合） | 不要                         |
  | コードの複雑さ                     | 複雑（`watch`が必要）              | シンプル                     |
  | 自分自身の値が変わった時の画面更新 | ✅ 自動                            | ✅ 自動                      |
  | 他の値の変更を監視して自分を更新   | ❌ なし（`watch`が必要）           | ✅ 自動                      |

  **`ref`を使うべき場合:**

  ```typescript
  // ✅ ref が適切な例
  const mood = ref(3) // ユーザーが手動で変更する値
  const showAddForm = ref(false) // 手動で表示/非表示を切り替える
  const editingQuote = ref<Quote | null>(null) // 手動で編集対象を設定
  ```

  **`computed`を使うべき場合:**

  ```typescript
  // ✅ computed が適切な例
  const authorId = computed(() => route.params.id as string) // route.params.id から計算
  const author = computed(() => getAuthor(authorId.value)) // authorId から計算
  const authorQuotes = computed(() => {
    return quotes.value.filter((quote) => quote.authorId === authorId.value)
  }) // quotes と authorId から計算
  ```

  **具体例で理解する:**

  **例1: `ref`を使う場合（手動更新が必要）**

  ```typescript
  // ❌ ref を使う場合
  const authorId = ref(route.params.id as string)
  const author = ref(getAuthor(authorId.value))
  const authorQuotes = ref<Quote[]>([])

  // route.params.id が変わった時に手動で更新する必要がある
  watch(
    () => route.params.id,
    (newId) => {
      authorId.value = newId as string
      author.value = getAuthor(authorId.value)
      authorQuotes.value = quotes.value.filter((quote) => quote.authorId === authorId.value)
    }
  )

  // quotes が変わった時も手動で更新する必要がある
  watch(quotes, () => {
    authorQuotes.value = quotes.value.filter((quote) => quote.authorId === authorId.value)
  })
  ```

  **例2: `computed`を使う場合（自動更新）**

  ```typescript
  // ✅ computed を使う場合
  const authorId = computed(() => route.params.id as string)
  const author = computed(() => getAuthor(authorId.value))
  const authorQuotes = computed(() => {
    return quotes.value.filter((quote) => quote.authorId === authorId.value)
  })
  // route.params.id や quotes が変わると自動で再計算される！
  ```

  **`computed`のメリット:**
  1. **リアクティビティ（自動更新）**: 依存する値が変わると自動で再計算される
  2. **パフォーマンス（キャッシュ）**: 依存する値が変わった時だけ再計算される（効率的）
  3. **コードの簡潔さ**: `watch`が不要で、コードがシンプルになる

  **`computed`が参照している値が変わると自動的に再計算される:**

  ```typescript
  const authorId = computed(() => route.params.id as string)

  // route.params.id が変わると...
  // → authorId.value が自動で再計算される
  // → authorId を使っている画面も自動で更新される
  ```

  **ネストした`computed`の例:**

  ```typescript
  // 50-52行目の例
  const authorId = computed(() => route.params.id as string)
  const author = computed(() => getAuthor(authorId.value))
  const authorName = computed(() => author.value?.name || '不明な著者')

  // route.params.id が変わると → authorId が更新
  // authorId が変わると → author が更新
  // author が変わると → authorName が更新
  // すべて自動で連鎖的に更新される
  ```

  **まとめ:**
  - `ref`: 自分自身の変更は検知して画面を更新するが、他の値の変更を監視して自分を更新する機能はない
  - `computed`: 依存する値の変更を監視して、自動で再計算する機能がある
  - 他の値から自動計算される値には`computed`を使う
  - 手動で値を変更する値には`ref`を使う

- `ref` / `reactive` / `computed` / `watch` を使ったステート管理と使い分け

  **評価項目:**
  - `ref` / `reactive` / `computed` / `watch` を使ったステート管理ができる
  - 上記の使い分けを正しくできる
  - `computed`の場合は依存する値の変更に応じてデコレートしたり、計算する処理を記載しておく
  - `watch`を使い親コンポーネントのpropsの値変更を検知して、`oldValue`と`newValue`を比較しつつ条件によって処理を書き分ける

  **各APIの概要:**

  | API        | 用途                                             | 特徴                                                     |
  | ---------- | ------------------------------------------------ | -------------------------------------------------------- |
  | `ref`      | プリミティブ値やオブジェクトをリアクティブにする | `.value`でアクセス、オブジェクト全体を置き換え可能       |
  | `reactive` | オブジェクトをリアクティブにする                 | 直接プロパティにアクセス、オブジェクト全体の置き換え不可 |
  | `computed` | 他の値から自動計算される値                       | 依存する値が変わると自動で再計算                         |
  | `watch`    | 値の変更を監視して処理を実行                     | `oldValue`と`newValue`を比較できる                       |

  **1. `ref`の使用例（本プロジェクト）:**

  ```typescript
  // pages/quotes/index.vue
  const showAddForm = ref(false) // フォームの表示/非表示を管理
  const editingQuote = ref<Quote | null>(null) // 編集中の名言を管理

  // 値の変更
  showAddForm.value = true
  editingQuote.value = quote
  ```

  **使用場面:**
  - プリミティブ値（`string`, `number`, `boolean`）を管理する場合
  - 小さなオブジェクトで、全体を置き換えることがある場合
  - 手動で値を変更する必要がある場合

  **2. `reactive`の使用例（本プロジェクト）:**

  ```typescript
  // pages/quotes/index.vue
  const form = reactive({
    text: '',
    authorId: '',
    tags: [] as string[],
  })

  // 個別のプロパティを直接更新（.value が不要）
  form.text = '新しいテキスト'
  form.authorId = '新しいID'
  form.tags = ['タグ1', 'タグ2']
  ```

  **使用場面:**
  - 大きなオブジェクトで、プロパティを頻繁に個別に更新する場合
  - ネストしたオブジェクトを扱う場合
  - オブジェクトの構造が固定されていて、全体を置き換えることがない場合

  **`ref`と`reactive`の使い分け:**

  | ケース                                     | 推奨       | 理由                                |
  | ------------------------------------------ | ---------- | ----------------------------------- |
  | プリミティブ値                             | `ref`      | `reactive`は使えない                |
  | 小さなオブジェクト（2-3個のプロパティ）    | `ref`      | どちらでも良いが、`ref`の方が一般的 |
  | 大きなオブジェクト（10個以上のプロパティ） | `reactive` | `.value`が多くて煩雑になる          |
  | 頻繁に個別のプロパティを更新               | `reactive` | `.value`が不要でシンプル            |
  | オブジェクト全体を置き換えることが多い     | `ref`      | `reactive`では置き換えができない    |

  **3. `computed`の使用例（本プロジェクト）:**

  **例1: 依存する値の変更に応じて計算する処理**

  ```typescript
  // pages/authors/[id]/quotes.vue
  const authorQuotes = computed(() => {
    return quotes.value.filter((quote) => quote.authorId === authorId.value) as Quote[]
  })
  ```

  - 依存: `quotes.value`, `authorId.value`
  - 処理: フィルタリング（計算処理）
  - `quotes`や`authorId`が変わると自動で再計算される

  **例2: 依存する値の変更に応じてデコレート・計算する処理**

  ```typescript
  // pages/authors/index.vue
  const authorsWithCount = computed(() => {
    // 1. 計算処理：名言数を集計
    const quoteCountMap = new Map<string, number>()
    quotes.value.forEach((quote) => {
      if (quote.authorId) {
        const count = quoteCountMap.get(quote.authorId) || 0
        quoteCountMap.set(quote.authorId, count + 1)
      }
    })

    // 2. デコレート処理：著者オブジェクトに名言数を追加
    return (
      authors.value
        .map((author) => ({
          ...author, // 元のプロパティを保持
          quoteCount: quoteCountMap.get(author.id) || 0, // 新しいプロパティを追加（デコレート）
        }))
        // 3. 計算処理：フィルタリング
        .filter((author) => author.quoteCount > 0)
        // 4. 計算処理：ソート
        .sort((a, b) => b.quoteCount - a.quoteCount)
    )
  })
  ```

  **デコレートとは:**
  - 既存のオブジェクトに新しいプロパティや情報を追加して拡張すること
  - この例では、元の`author`オブジェクトに`quoteCount`プロパティを追加している

  **処理の流れ:**
  1. **計算**: 名言数を集計（`quoteCountMap`を作成）
  2. **デコレート**: 著者オブジェクトに`quoteCount`を追加
  3. **計算**: 名言がある著者のみフィルタリング
  4. **計算**: 名言数でソート

  **依存する値:**
  - `quotes.value`: 名言データが変わると再計算
  - `authors.value`: 著者データが変わると再計算

  **例3: データの変換（デコレート）**

  ```typescript
  // components/QuoteForm.vue
  const tagsInput = computed({
    get: () => (props.modelValue.tags || []).join(', '), // 配列を文字列に変換
    set: (value: string) => {
      const tags = parseTags(value) // 文字列を配列に変換
      emit('update:modelValue', {
        ...props.modelValue,
        tags,
      })
    },
  })
  ```

  - 依存: `props.modelValue.tags`
  - 処理: 配列と文字列の相互変換（デコレート・計算処理）

  **4. `watch`の使用例（本プロジェクト）:**

  **例1: 複数の値を監視**

  ```typescript
  // pages/index.vue
  watch([mood, quotes], () => {
    salt.value = 0
    pickQuote()
  })
  ```

  - `mood`と`quotes`のどちらかが変わると実行される

  **例2: propsの変更を検知して`oldValue`と`newValue`を比較（評価項目の要件）**

  ```typescript
  // components/QuoteForm.vue
  watch(
    () => props.modelValue,
    (newValue, oldValue) => {
      // 編集モードがtrueの場合のみ処理
      if (!props.isEditMode) return

      // oldValueとnewValueを比較して、変更があった場合のみ処理
      if (oldValue && newValue) {
        // テキストが変更された場合
        if (oldValue.text !== newValue.text) {
          console.log('テキストが変更されました:', {
            old: oldValue.text,
            new: newValue.text,
          })
        }

        // 著者IDが変更された場合
        if (oldValue.authorId !== newValue.authorId) {
          console.log('著者IDが変更されました:', {
            old: oldValue.authorId,
            new: newValue.authorId,
          })
          // 条件によって処理を分岐
          if (newValue.authorId && !oldValue.authorId) {
            // 新しく著者IDが設定された場合のみ、著者一覧を再読み込み
            loadAuthors()
          }
        }

        // タグが変更された場合
        const oldTags = (oldValue.tags || []).join(',')
        const newTags = (newValue.tags || []).join(',')
        if (oldTags !== newTags) {
          console.log('タグが変更されました:', {
            old: oldValue.tags,
            new: newValue.tags,
          })
        }
      }
    },
    { deep: true } // オブジェクトの深い監視
  )
  ```

  **この実装のポイント:**
  1. **propsの変更を検知**: `() => props.modelValue`で監視対象を指定
  2. **oldValueとnewValueを比較**: コールバック関数の第2引数と第3引数で取得
  3. **条件によって処理を分岐**:
     - テキストが変更された場合
     - 著者IDが変更された場合（さらに条件分岐：新しく設定された場合のみ`loadAuthors()`を実行）
     - タグが変更された場合
  4. **深い監視**: `{ deep: true }`でオブジェクトのネストされたプロパティも監視

  **使い分けのまとめ:**

  | 用途                                     | 使用するAPI             | 理由                                 |
  | ---------------------------------------- | ----------------------- | ------------------------------------ |
  | プリミティブ値を管理                     | `ref`                   | `reactive`は使えない                 |
  | 手動で値を変更する                       | `ref` または `reactive` | オブジェクトの大きさや更新方法で選択 |
  | 他の値から自動計算                       | `computed`              | 依存する値が変わると自動で再計算     |
  | 値の変更を監視して処理を実行             | `watch`                 | `oldValue`と`newValue`を比較できる   |
  | 依存する値の変更に応じてデコレート・計算 | `computed`              | 自動で再計算される                   |
  | propsの変更を検知して条件分岐            | `watch`                 | `oldValue`と`newValue`を比較できる   |

  **本プロジェクトでの実装箇所まとめ:**
  - **`ref`**: `pages/quotes/index.vue`（`showAddForm`, `editingQuote`）、`pages/index.vue`（`mood`, `selectedQuote`）など
  - **`reactive`**: `pages/quotes/index.vue`（`form`）
  - **`computed`**:
    - `pages/authors/index.vue`（`authorsWithCount` - デコレート・計算処理）
    - `pages/authors/[id]/quotes.vue`（`authorQuotes` - フィルタリング）
    - `components/QuoteForm.vue`（`tagsInput` - データ変換）
  - **`watch`**:
    - `pages/index.vue`（`mood`と`quotes`の監視）
    - `components/QuoteForm.vue`（`props.modelValue`の監視 - oldValue/newValue比較）

---

## Nuxtのユニバーサルレンダリング

**評価項目:**

- Nuxtのユニバーサルレンダリングを使って簡単なアプリケーションを作成できる

### ユニバーサルレンダリングとは

**ユニバーサルレンダリング（Universal Rendering）**とは、サーバーサイドとクライアントサイドの両方で同じアプリケーションを実行できることである。Nuxt.jsでは、デフォルトでユニバーサルレンダリングが有効になっている。

### 3つのレンダリング方式の比較

#### 1. CSR（Client-Side Rendering） - 変更前

```
【ブラウザ】
1. 空のHTMLを受け取る
2. JavaScriptを実行
3. localStorageからデータを取得
4. 画面を表示
```

**問題点:**

- 初回表示が遅い（JavaScriptの実行を待つ必要がある）
- SEOに不利（検索エンジンが空のHTMLしか見られない）

#### 2. SSR（Server-Side Rendering） - 変更後

```
【サーバー】
1. リクエストを受け取る
2. データを取得（server/utils/quotes-storage.ts）
3. HTMLを生成（データが入った状態）
4. ブラウザに送信

【ブラウザ】
1. 完成したHTMLを受け取る
2. すぐに表示できる！
```

**メリット:**

- 初回表示が速い（サーバーでHTMLが完成している）
- SEOに有利（検索エンジンが完成したHTMLを見られる）

#### 3. ユニバーサルレンダリング（SSR + CSR） - 今回の実装

```
【初回アクセス時 - SSR】
1. ブラウザ → サーバーにリクエスト
2. サーバーがデータを取得
3. サーバーがHTMLを生成
4. 完成したHTMLを受け取る
5. すぐに表示できる！

【2回目以降のページ遷移 - CSR（SPA）】
1. JavaScriptでページ遷移
2. APIからデータを取得
3. 画面を更新（ページ全体を再読み込みしない）
```

**メリット:**

- 初回表示が速い（SSR）
- 2回目以降も速い（SPA）
- SEOに有利

### 本アプリでの実装

#### 1. useFetchによるデータ取得

**実装箇所: `pages/index.vue`**

```typescript
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, getAuthorName } = useQuotes()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
```

**`useFetch`の動作:**

- **サーバーサイド**: `/api/quotes`エンドポイントを呼び出し、サーバー上のメモリからデータを取得
- **クライアントサイド**: 同じエンドポイントを呼び出し、APIからデータを取得

**重要なポイント:**

- `await`を使うことで、サーバーサイドでデータ取得が完了してからHTMLを生成
- クライアントサイドでも同じコードが実行される（ハイドレーション）

#### 2. サーバーAPIルート

**実装箇所: `server/api/quotes/index.get.ts`**

```typescript
import type { Quote } from '@/types/quote'
import { getQuotes } from '~/server/utils/quotes-storage'

/**
 * GET /api/quotes
 * 名言一覧を取得
 */
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})
```

**動作:**

- サーバーサイドで実行される
- `server/utils/quotes-storage.ts`からメモリ上のデータを取得する
- JSON形式でレスポンスを返す

**サーバーAPIルートとページコンポーネントの関係:**

`pages/index.vue`で`useFetch('/api/quotes')`を実行すると、Nuxt 3が自動的に`server/api/quotes/index.get.ts`を呼び出す。

**データの流れ:**

```
pages/index.vue (55行目)
  ↓
useFetch('/api/quotes') を実行
  ↓
Nuxt 3が自動的にマッピング
  ↓
server/api/quotes/index.get.ts が実行される
  ↓
getQuotes() を呼び出す
  ↓
server/utils/quotes-storage.ts からデータを取得
  ↓
データが useFetch に返される
  ↓
pages/index.vue (60-62行目)
  ↓
store.quotes = fetchedQuotes.value でストアに反映
  ↓
HTMLを生成（データが入った状態）
  ↓
ブラウザに送信
```

**Nuxt 3の自動マッピング:**

Nuxt 3は`server/api/`配下のファイルを自動的にAPIルートとして認識する。

```
URL: /api/quotes
    ↓
ファイル: server/api/quotes/index.get.ts
```

**ファイル名の規則:**

```
server/api/quotes/index.get.ts
                    ↑      ↑
                 ディレクトリ  HTTPメソッド
```

- `index.get.ts` → `GET /api/quotes`
- `index.post.ts` → `POST /api/quotes`
- `[id].get.ts` → `GET /api/quotes/:id`
- `[id].put.ts` → `PUT /api/quotes/:id`
- `[id].delete.ts` → `DELETE /api/quotes/:id`

**`defineEventHandler`の役割:**

```typescript
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})
```

この関数がAPIエンドポイントの実装になる。返り値がJSONとしてクライアントに返される。

**ページURLとAPIエンドポイントURLの違い:**

| URL           | 種類                 | 説明                                              |
| ------------- | -------------------- | ------------------------------------------------- |
| `/quotes`     | ページURL            | ブラウザのURLバーに表示される（ルーティング）     |
| `/api/quotes` | APIエンドポイントURL | ブラウザのURLバーには表示されない（内部的な通信） |

**重要なポイント:**

- `/quotes`はページのURLで、ユーザーがアクセスするURLである
- `/api/quotes`はAPIエンドポイントのURLで、`useFetch('/api/quotes')`が内部的に呼び出す
- `useFetch('/api/quotes')`を実行しても、ブラウザのURLバーは`/quotes`のままである
- これは正しい動作で、ページURLとAPIエンドポイントURLは別物である

**実際の動作例:**

1. ユーザーが`http://localhost:3000/quotes`にアクセス
2. ブラウザのURLバーには`/quotes`と表示される
3. `pages/quotes/index.vue`が実行される
4. `useFetch('/api/quotes')`が内部的に`/api/quotes`エンドポイントを呼び出す
5. `server/api/quotes/index.get.ts`が実行される
6. データが取得され、ページに表示される

**REST APIの設計:**

このプロジェクトでは、**REST API**の設計パターンに従っている。

**REST APIとは:**

REST（Representational State Transfer）は、Web APIの設計原則である。以下の原則に従う：

1. **リソースベースのURL**: `/api/quotes`のように、リソース（名言）を表すURLを使用
2. **HTTPメソッドで操作を表現**: GET（取得）、POST（作成）、PUT（更新）、DELETE（削除）
3. **ステータスコードの使用**: 200（成功）、404（見つからない）、400（不正なリクエスト）など
4. **JSON形式でのデータ交換**: リクエストとレスポンスはJSON形式

**本プロジェクトでのREST API実装:**

| HTTPメソッド | URL               | 操作               | 実装ファイル                       |
| ------------ | ----------------- | ------------------ | ---------------------------------- |
| `GET`        | `/api/quotes`     | 名言一覧を取得     | `server/api/quotes/index.get.ts`   |
| `POST`       | `/api/quotes`     | 名言を新規作成     | `server/api/quotes/index.post.ts`  |
| `GET`        | `/api/quotes/:id` | 指定IDの名言を取得 | `server/api/quotes/[id].get.ts`    |
| `PUT`        | `/api/quotes/:id` | 指定IDの名言を更新 | `server/api/quotes/[id].put.ts`    |
| `DELETE`     | `/api/quotes/:id` | 指定IDの名言を削除 | `server/api/quotes/[id].delete.ts` |

**REST APIの特徴:**

- **統一されたインターフェース**: すべてのエンドポイントが同じパターンに従う
- **ステートレス**: 各リクエストは独立しており、サーバーは前のリクエストを覚えていない
- **リソース指向**: URLがリソース（名言）を表し、HTTPメソッドが操作を表す

**例:**

```typescript
// GET /api/quotes - 一覧取得
const { data } = await useFetch<Quote[]>('/api/quotes')

// POST /api/quotes - 新規作成
await $fetch('/api/quotes', {
  method: 'POST',
  body: { text: '新しい名言', authorId: 'xxx' },
})

// GET /api/quotes/:id - 個別取得
const { data } = await useFetch<Quote>(`/api/quotes/${id}`)

// PUT /api/quotes/:id - 更新
await $fetch(`/api/quotes/${id}`, {
  method: 'PUT',
  body: { text: '更新された名言' },
})

// DELETE /api/quotes/:id - 削除
await $fetch(`/api/quotes/${id}`, {
  method: 'DELETE',
})
```

**まとめ:**

- `/api/quotes`はREST APIのエンドポイントである
- HTTPメソッド（GET、POST、PUT、DELETE）で操作を表現する
- リソースベースのURL設計に従っている
- これは標準的なREST APIの実装である

#### 3. サーバーサイドのストレージ

**実装箇所: `server/utils/quotes-storage.ts`**

```typescript
import type { Quote } from '@/types/quote'

/**
 * メモリ上に名言データを保存する簡易ストレージ
 * サーバー再起動でデータは消える（学習用）
 */
let quotesStorage: Quote[] = []

/**
 * 名言一覧を取得
 */
export function getQuotes(): Quote[] {
  return [...quotesStorage]
}
```

**動作:**

- サーバーのメモリ上にデータを保存する
- サーバーサイドでのみ実行される
- サーバー再起動でデータは消える（学習用の簡易実装である）

**サーバー再起動後の動作:**

`npm run dev`を停止（Ctrl+C）して再起動すると、サーバープロセスが終了・再起動するため、サーバーサイドのメモリ上のデータは消える。

**データの保存場所:**

| 場所                                 | データの状態 | 説明                                                                    |
| ------------------------------------ | ------------ | ----------------------------------------------------------------------- |
| **サーバーサイドのメモリ**           | 消える       | `server/utils/quotes-storage.ts`の`quotesStorage`変数は空配列に戻る     |
| **クライアントサイドのlocalStorage** | 残る         | `pinia-plugin-persistedstate`により、ブラウザのlocalStorageに保存される |

**サーバー再起動後の初回アクセス時の動作:**

```
1. SSRが働く（サーバーサイドでHTMLを生成）
   ↓
2. useFetch('/api/quotes') がサーバーサイドで実行される
   ↓
3. サーバーのメモリは空なので、空の配列 [] が返される
   ↓
4. store.quotes = fetchedQuotes.value で空の配列がストアに反映される
   ↓
5. HTMLが生成される（空のデータが入った状態）
   ↓
6. ブラウザに送信される
   ↓
7. クライアントサイドでハイドレーション
   ↓
8. ストアがlocalStorageから復元される（pinia-plugin-persistedstate）
   ↓
9. localStorageのデータがストアに反映される
   ↓
10. 画面にデータが表示される（localStorageから復元されたデータ）
```

**重要なポイント:**

- サーバー再起動後、サーバーサイドのメモリ上のデータは消える
- しかし、クライアントサイドのlocalStorageにはデータが残る
- 初回アクセス時はSSRで空のデータがHTMLに含まれるが、クライアントサイドでハイドレーション時にlocalStorageから復元される
- 見た目上はデータが残っているように見える（localStorageから復元されるため）

**データの同期:**

- サーバーサイドのメモリ上のデータとクライアントサイドのlocalStorageのデータは同期していない
- サーバー再起動後、サーバーサイドのメモリは空だが、クライアントサイドのlocalStorageにはデータが残る
- 新しいデータを追加すると、サーバーサイドのメモリとクライアントサイドのlocalStorageの両方に保存される

#### 4. ストアへの反映

**実装箇所: 各ページコンポーネント**

```typescript
// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
```

**動作:**

- サーバーサイドで取得したデータをPiniaストアに反映する
- クライアントサイドでも同じストアが使われる（ハイドレーション）

### データの流れ

#### シナリオ1: 初回アクセス時（SSR）

**状況**: ブラウザで`http://localhost:3000/`に初めてアクセスする

```
【ユーザーの操作】
1. ブラウザのアドレスバーに「http://localhost:3000/」を入力してEnter
   （または、ブックマークからアクセス、外部リンクからアクセス）

【サーバーサイド（SSR）】
2. サーバーがリクエストを受け取る（GET /）
3. サーバー側で pages/index.vue を実行
4. useFetch('/api/quotes') が実行される（サーバーサイド）
5. server/api/quotes/index.get.ts が実行される
6. server/utils/quotes-storage.ts からデータを取得
7. データが入ったHTMLを生成（サーバーサイドで完成）
8. ブラウザに送信

【ブラウザ】
9. ブラウザがHTMLを受け取る（データが入った状態）
10. ブラウザがHTMLを表示（すぐに表示できる！）
11. JavaScriptが読み込まれる
12. JavaScriptが実行される
```

**重要なポイント:**

- この時点で、HTMLにはすでにデータが入っている
- ユーザーはすぐに内容を見ることができる（SSRのメリット）

#### シナリオ2: ハイドレーション（初回アクセス時の続き）

**状況**: シナリオ1の続き。JavaScriptが実行された後

```
【クライアントサイド（ハイドレーション）】
13. Vue.jsが起動する
14. pages/index.vue が再度実行される（クライアントサイド）
15. useFetch('/api/quotes') が実行される（クライアントサイド）
16. /api/quotes エンドポイントからデータを取得
17. サーバーサイドで生成されたHTMLとクライアントサイドの状態を同期
18. インタラクティブな機能が有効になる（ボタンクリックなど）

【結果】
- サーバーサイドで生成されたHTMLとクライアントサイドの状態が一致する
- これにより、ユーザーが操作できる状態になる
```

**重要なポイント:**

- ハイドレーションは、初回アクセス時に1回だけ行われる
- サーバーサイドで生成されたHTMLとクライアントサイドの状態を同期する
- これにより、ページがインタラクティブになる

#### シナリオ3: 2回目以降のページ遷移（CSR / SPA）

**状況**: トップページ（`/`）から名言一覧ページ（`/quotes`）に遷移する

```
【ユーザーの操作】
1. トップページ（/）で「名言一覧」リンクをクリック
   （NuxtLinkコンポーネントを使用）

【クライアントサイド（CSR / SPA）】
2. JavaScriptがリンククリックを検知
3. ページ全体を再読み込みしない（SPA）
4. 新しいページコンポーネント（pages/quotes/index.vue）が実行される
5. useFetch('/api/quotes') が実行される（クライアントサイド）
6. /api/quotes エンドポイントからデータを取得（HTTPリクエスト）
7. データが取得される
8. 画面を更新（ページ全体を再読み込みしない）

【結果】
- ページ全体を再読み込みせずに、データを取得して画面を更新する
- これにより、高速なページ遷移が実現される（SPAのメリット）
```

**重要なポイント:**

- この時点では、サーバーサイドでのHTML生成は行われない
- クライアントサイドでデータを取得して画面を更新する
- ページ全体を再読み込みしないため、高速に動作する

#### シナリオ4: 別のページから戻ってきた時

**状況**: 名言一覧ページ（`/quotes`）から名言詳細ページ（`/quotes/123`）に遷移し、戻るボタンで戻る

```
【ユーザーの操作】
1. 名言一覧ページ（/quotes）で「詳細」リンクをクリック
2. 名言詳細ページ（/quotes/123）が表示される
3. ブラウザの「戻る」ボタンをクリック

【クライアントサイド（CSR / SPA）】
4. JavaScriptが戻るボタンを検知
5. ページ全体を再読み込みしない（SPA）
6. 前のページコンポーネント（pages/quotes/index.vue）が実行される
7. useFetch('/api/quotes') が実行される（クライアントサイド）
8. /api/quotes エンドポイントからデータを取得
9. 画面を更新

【結果】
- ページ全体を再読み込みせずに、データを取得して画面を更新する
- これもCSR（クライアントサイドレンダリング）である
```

**重要なポイント:**

- 戻るボタンでも、ページ全体を再読み込みしない
- クライアントサイドでデータを取得して画面を更新する
- これもCSR（SPA）の動作である

### タイミングのまとめ

| タイミング                 | 処理                                  | 実行場所           |
| -------------------------- | ------------------------------------- | ------------------ |
| **初回アクセス時**         | SSR（サーバーサイドレンダリング）     | サーバーサイド     |
| **初回アクセス時（続き）** | ハイドレーション                      | クライアントサイド |
| **2回目以降のページ遷移**  | CSR（クライアントサイドレンダリング） | クライアントサイド |
| **戻るボタンで戻る**       | CSR（クライアントサイドレンダリング） | クライアントサイド |

### 具体的な画面の流れ

**例: トップページ（/）→ 名言一覧（/quotes）→ トップページ（/）に戻る**

```
1. 初回アクセス: http://localhost:3000/
   → SSRが実行される（サーバーサイドでHTML生成）
   → ハイドレーションが実行される（クライアントサイドで同期）

2. 「名言一覧」リンクをクリック
   → CSRが実行される（クライアントサイドでデータ取得）
   → ページ全体を再読み込みしない

3. 「トップページに戻る」リンクをクリック
   → CSRが実行される（クライアントサイドでデータ取得）
   → ページ全体を再読み込みしない
```

**重要なポイント:**

- 初回アクセス時のみSSRが実行される
- ハイドレーションは、初回アクセス時に1回だけ実行される
- 2回目以降のページ遷移（リンククリック、戻るボタンなど）は、すべてCSR（SPA）で実行される

### SSRが実行されるタイミング

**SSRが実行されるのは、以下の場合のみである：**

1. **初回アクセス時（ページ全体の再読み込み）**
   - ブラウザのアドレスバーにURLを入力してEnter
   - ブックマークからアクセス
   - 外部リンクからアクセス
   - ブラウザを完全に閉じて、再度開いてアクセス
   - ページ全体を再読み込み（F5キー、Ctrl+Rなど）

2. **ページ全体を再読み込みした時**
   - F5キーを押す
   - Ctrl+R（Windows）または Cmd+R（Mac）を押す
   - ブラウザの再読み込みボタンをクリック

**SSRが実行されない場合：**

1. **データが変わった時**
   - 名言を追加した時 → CSRでデータを取得して更新
   - 名言を編集した時 → CSRでデータを取得して更新
   - 名言を削除した時 → CSRでデータを取得して更新

2. **ページ遷移した時（リンククリック、戻るボタンなど）**
   - `NuxtLink`でページ遷移 → CSR（SPA）で実行
     - **例**: 初回アクセス時にSSRが実行されたページ（`/`）から、`NuxtLink`で別のページ（`/quotes`）に遷移する時
   - `router.push()`でページ遷移 → CSR（SPA）で実行
     - **例**: 初回アクセス時にSSRが実行されたページから、`router.push()`で別のページに遷移する時
   - ブラウザの戻るボタン → CSR（SPA）で実行
     - **例**: 初回アクセス時にSSRが実行されたページ（`/`）から別のページ（`/quotes`）に遷移し、その後ブラウザの戻るボタンで戻る時

**データが変わった時の動作例:**

```
【ユーザーの操作】
1. 名言一覧ページ（/quotes）で「新規追加」ボタンをクリック
2. フォームに入力して「保存」ボタンをクリック

【クライアントサイド（CSR）】
3. addQuote() が実行される（クライアントサイド）
4. APIエンドポイント（POST /api/quotes）が呼び出される
5. サーバーサイドのメモリにデータが保存される
6. クライアントサイドのストアが更新される
7. 画面が更新される（ページ全体を再読み込みしない）

【結果】
- SSRは実行されない
- クライアントサイドでデータを取得して更新する
- ページ全体を再読み込みしないため、高速に動作する
```

**重要なポイント:**

- **データが変わった時は、SSRではなくCSRでデータを取得して更新する**
- **ページ全体を再読み込みしない限り、SSRは実行されない**
- **初回アクセス時のみSSRが実行される**
- **2回目以降のページ遷移は、すべてCSR（SPA）で実行される**

**具体的なシナリオ:**

**シナリオA: 初回アクセス → 別のページに遷移**

```
1. 初回アクセス: http://localhost:3000/
   → SSRが実行される（サーバーサイドでHTML生成）
   → ハイドレーションが実行される（クライアントサイドで同期）
   → **重要**: この時点でSSRで取得できるHTMLは「/」のページのものだけ
   → 他のページ（/quotes、/authorsなど）のHTMLは生成されない

2. トップページ（/）で「名言一覧」リンク（NuxtLink）をクリック
   → CSR（SPA）が実行される（クライアントサイドでデータ取得）
   → **重要**: SSRは実行されない（CSRのみ）
   → ページ全体を再読み込みしない
   → 名言一覧ページ（/quotes）が表示される
```

**重要なポイント:**

- **初回アクセス時にSSRで取得できるHTMLは、アクセスしたページ（`/`）のものだけである**
- **他のページ（`/quotes`、`/authors`など）のHTMLは、初回アクセス時には生成されない**
- **`NuxtLink`でページ遷移した場合、SSRは実行されず、CSR（SPA）のみが実行される**

**シナリオB: 初回アクセス → 別のページに遷移 → 戻るボタンで戻る**

```
1. 初回アクセス: http://localhost:3000/
   → SSRが実行される（サーバーサイドでHTML生成）
   → ハイドレーションが実行される（クライアントサイドで同期）

2. トップページ（/）で「名言一覧」リンク（NuxtLink）をクリック
   → CSR（SPA）が実行される（クライアントサイドでデータ取得）
   → 名言一覧ページ（/quotes）が表示される

3. ブラウザの「戻る」ボタンをクリック
   → CSR（SPA）が実行される（クライアントサイドでデータ取得）
   → ページ全体を再読み込みしない
   → トップページ（/）が表示される
```

**シナリオC: 直接別のページに初回アクセスした場合**

```
1. 初回アクセス: http://localhost:3000/quotes
   → SSRが実行される（サーバーサイドでHTML生成）
   → この時点でSSRで取得できるHTMLは「/quotes」のページのものだけ
   → ハイドレーションが実行される（クライアントサイドで同期）

2. 名言一覧ページ（/quotes）で「トップページ」リンク（NuxtLink）をクリック
   → CSR（SPA）が実行される（クライアントサイドでデータ取得）
   → SSRは実行されない（CSRのみ）
   → ページ全体を再読み込みしない
   → トップページ（/）が表示される
```

**重要なポイント:**

- **各ページのSSRは、そのページに初めてアクセスした時（ページ全体の再読み込み）のみ実行される**
- **直接`http://localhost:3000/quotes`に初めてアクセスした場合は、そのページのSSRが実行される**
- **`NuxtLink`でページ遷移した場合、SSRは実行されず、CSR（SPA）のみが実行される**

### なぜNuxtLinkではSSRが起きないのか？なぜページリロードやURL直打ちではSSRが起きるのか？

#### 1. NuxtLinkでページ遷移した時（SSRが起きない理由）

**技術的な仕組み:**

```
【NuxtLinkの動作】
1. ユーザーが「名言一覧」リンク（NuxtLink）をクリック
2. JavaScriptがクリックイベントを検知
3. JavaScriptがページ遷移を制御（クライアントサイドルーティング）
4. サーバーにHTTPリクエストを送らない
5. クライアントサイドでデータを取得（useFetchが実行される）
6. 画面を更新（ページ全体を再読み込みしない）
```

**なぜSSRが起きないのか:**

- **`NuxtLink`はJavaScriptでページ遷移を制御する（クライアントサイドルーティング）**
- **サーバーにHTTPリクエストを送らないため、サーバーサイドでのHTML生成が行われない**
- **これはSPA（Single Page Application）の仕組みである**

#### 2. ページリロードやURL直打ちの時（SSRが起きる理由）

**技術的な仕組み:**

```
【ページリロードやURL直打ちの動作】
1. ユーザーがブラウザのアドレスバーに「http://localhost:3000/quotes」を入力してEnter
   （または、F5キーを押す、Ctrl+Rを押すなど）
2. ブラウザがサーバーにHTTPリクエストを送る（GET /quotes）
3. サーバーがリクエストを受け取る
4. サーバーサイドで pages/quotes/index.vue を実行
5. useFetch('/api/quotes') が実行される（サーバーサイド）
6. サーバーサイドでデータを取得
7. サーバーサイドでHTMLを生成（データが入った状態）
8. ブラウザに送信
```

**なぜSSRが起きるのか:**

- **ページリロードやURL直打ちは、サーバーにHTTPリクエストを送る**
- **サーバーがリクエストを受け取ると、サーバーサイドでHTMLを生成する必要がある**
- **これがSSR（Server-Side Rendering）の仕組みである**

#### 3. メリット・デメリット

**NuxtLinkでページ遷移した時（CSR / SPA）のメリット:**

| メリット                   | 説明                                                                   |
| -------------------------- | ---------------------------------------------------------------------- |
| **高速なページ遷移**       | ページ全体を再読み込みしないため、遷移が速い                           |
| **スムーズなユーザー体験** | 画面がちらつかない（ページ全体を再読み込みしない）                     |
| **サーバー負荷の軽減**     | サーバーにHTTPリクエストを送らないため、サーバーの負荷が少ない         |
| **オフライン対応**         | 一度読み込んだページは、オフラインでも表示できる（キャッシュがあれば） |

**NuxtLinkでページ遷移した時（CSR / SPA）のデメリット:**

| デメリット                             | 説明                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **SEOに不利**                          | 検索エンジンがページの内容を正しく認識できない可能性がある（ただし、初回アクセス時にSSRが実行されるため、この問題は軽減される）     |
| **初回表示が遅い可能性**               | データ取得に時間がかかる場合、画面が空の状態が続く可能性がある（ただし、初回アクセス時にSSRが実行されるため、この問題は軽減される） |
| **JavaScriptが無効な場合に動作しない** | JavaScriptが無効な環境では、ページ遷移ができない                                                                                    |

**ページリロードやURL直打ちの時（SSR）のメリット:**

| メリット                         | 説明                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| **SEOに有利**                    | 検索エンジンが完成したHTMLを見られるため、SEOに有利                                          |
| **初回表示が速い**               | サーバーサイドでHTMLが完成しているため、すぐに表示できる                                     |
| **JavaScriptが無効でも動作する** | JavaScriptが無効な環境でも、基本的な表示は可能（ただし、インタラクティブな機能は動作しない） |

**ページリロードやURL直打ちの時（SSR）のデメリット:**

| デメリット             | 説明                                                     |
| ---------------------- | -------------------------------------------------------- |
| **サーバー負荷が高い** | サーバーサイドでHTMLを生成するため、サーバーの負荷が高い |
| **ページ遷移が遅い**   | ページ全体を再読み込みするため、遷移が遅い               |
| **画面がちらつく**     | ページ全体を再読み込みするため、画面がちらつく           |

#### 4. まとめ

**Nuxt.jsのユニバーサルレンダリングの設計思想:**

- **初回アクセス時**: SSRを実行して、SEOに有利で、初回表示が速いHTMLを生成する
- **2回目以降のページ遷移**: CSR（SPA）を実行して、高速でスムーズなページ遷移を実現する

**この設計により、以下のメリットが得られる:**

1. **SEOに有利**: 初回アクセス時にSSRが実行されるため、検索エンジンが完成したHTMLを見られる
2. **初回表示が速い**: 初回アクセス時にSSRが実行されるため、すぐに表示できる
3. **高速なページ遷移**: 2回目以降のページ遷移はCSR（SPA）で実行されるため、高速に動作する
4. **スムーズなユーザー体験**: ページ全体を再読み込みしないため、画面がちらつかない

**つまり、Nuxt.jsのユニバーサルレンダリングは、SSRとCSRの両方のメリットを活かす設計である。**

### CSRでもサーバーのデータを取得できる仕組み

**重要な質問:**

- NuxtLinkでCSRが起こるのは理解した
- でも、どうやってサーバーのデータを取得しているのか？
- CSRでもサーバーにあるデータを問題なく取得できるのか？

**答え: はい、CSRでもサーバーのデータを問題なく取得できる。`useFetch`がAPIエンドポイントにHTTPリクエストを送ってデータを取得している。**

#### 1. SSRとCSRでのデータ取得の違い

**SSR（サーバーサイド）でのデータ取得:**

```
【SSRでのuseFetchの動作】
1. サーバーサイドで pages/quotes/index.vue が実行される
2. useFetch('/api/quotes') が実行される（サーバーサイド）
3. Nuxt 3が server/api/quotes/index.get.ts を直接呼び出す（内部関数呼び出し）
4. getQuotes() が実行される（サーバー内のメモリから直接データを取得）
5. データが返される（HTTPリクエストなし）
6. HTMLが生成される（データが入った状態）
```

**重要なポイント:**

- **SSRでは、HTTPリクエストを送らない**
- **サーバー内で直接関数を呼び出す（内部関数呼び出し）**
- **サーバー内のメモリから直接データを取得する**

**CSR（クライアントサイド）でのデータ取得:**

```
【CSRでのuseFetchの動作】
1. クライアントサイドで pages/quotes/index.vue が実行される
2. useFetch('/api/quotes') が実行される（クライアントサイド）
3. ブラウザがサーバーにHTTPリクエストを送る（GET /api/quotes）
4. サーバーがリクエストを受け取る
5. server/api/quotes/index.get.ts が実行される
6. getQuotes() が実行される（サーバー内のメモリからデータを取得）
7. サーバーがJSON形式でデータを返す
8. ブラウザがデータを受け取る
9. 画面が更新される
```

**重要なポイント:**

- **CSRでは、HTTPリクエストを送る**
- **APIエンドポイント（`/api/quotes`）にHTTPリクエストを送る**
- **サーバーがデータを返す（JSON形式）**
- **ブラウザがデータを受け取る**

#### 2. 具体的なコードの動作

**実装箇所: `pages/quotes/index.vue`**

```typescript
// 78-79行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
```

**このコードは、SSRとCSRの両方で実行される:**

**SSRの場合:**

```
1. サーバーサイドで useFetch('/api/quotes') が実行される
2. Nuxt 3が server/api/quotes/index.get.ts を直接呼び出す
3. サーバー内のメモリからデータを取得
4. HTMLが生成される
```

**CSRの場合:**

```
1. クライアントサイドで useFetch('/api/quotes') が実行される
2. ブラウザが http://localhost:3000/api/quotes にHTTPリクエストを送る
3. サーバーがリクエストを受け取る
4. server/api/quotes/index.get.ts が実行される
5. サーバーがJSON形式でデータを返す
6. ブラウザがデータを受け取る
```

**実装箇所: `server/api/quotes/index.get.ts`**

```typescript
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})
```

**このコードは、SSRとCSRの両方で実行される:**

- **SSR**: サーバーサイドで直接呼び出される（内部関数呼び出し）
- **CSR**: HTTPリクエストを受け取って実行される（APIエンドポイント）

#### 3. NuxtLinkでページ遷移した時の具体的な動作

**シナリオ: トップページ（/）から名言一覧ページ（/quotes）に遷移**

```
【ユーザーの操作】
1. トップページ（/）で「名言一覧」リンク（NuxtLink）をクリック

【クライアントサイド（CSR）】
2. JavaScriptがクリックイベントを検知
3. JavaScriptがページ遷移を制御（クライアントサイドルーティング）
4. ページ全体を再読み込みしない（SPA）
5. 新しいページコンポーネント（pages/quotes/index.vue）が実行される
6. useFetch('/api/quotes') が実行される（クライアントサイド）
7. ブラウザが http://localhost:3000/api/quotes にHTTPリクエストを送る
8. サーバーがリクエストを受け取る
9. server/api/quotes/index.get.ts が実行される
10. getQuotes() が実行される（サーバー内のメモリからデータを取得）
11. サーバーがJSON形式でデータを返す
12. ブラウザがデータを受け取る
13. 画面が更新される（ページ全体を再読み込みしない）
```

**重要なポイント:**

- **CSRでも、サーバーにHTTPリクエストを送ってデータを取得している**
- **APIエンドポイント（`/api/quotes`）が呼び出される**
- **サーバーがデータを返す（JSON形式）**
- **ブラウザがデータを受け取る**

#### 4. SSRとCSRの違いのまとめ

| 項目               | SSR（サーバーサイド）                              | CSR（クライアントサイド）               |
| ------------------ | -------------------------------------------------- | --------------------------------------- |
| **データ取得方法** | サーバー内で直接関数を呼び出す（内部関数呼び出し） | APIエンドポイントにHTTPリクエストを送る |
| **HTTPリクエスト** | なし                                               | あり（GET /api/quotes）                 |
| **データの取得元** | サーバー内のメモリから直接取得                     | サーバーからHTTPレスポンスで取得        |
| **実行タイミング** | 初回アクセス時、ページリロード時                   | ページ遷移時、データ更新時              |
| **HTML生成**       | サーバーサイドでHTMLを生成                         | HTMLは生成しない（画面を更新するだけ）  |

#### 5. なぜCSRでもサーバーのデータを取得できるのか？

**理由:**

- **`useFetch`は、SSRとCSRの両方で実行される**
- **CSRでは、`useFetch`がAPIエンドポイント（`/api/quotes`）にHTTPリクエストを送る**
- **サーバーAPIルート（`server/api/quotes/index.get.ts`）がそのリクエストを受け取る**
- **サーバーがデータを返す（JSON形式）**
- **ブラウザがデータを受け取る**

**つまり、CSRでもサーバーのデータを問題なく取得できる。これは、REST APIの仕組みである。**

**まとめ:**

| タイミング                               | SSRが実行されるか | 説明                                                |
| ---------------------------------------- | ----------------- | --------------------------------------------------- |
| 初回アクセス時（ページ全体の再読み込み） | ✅ 実行される     | アクセスしたページのHTMLのみ生成される              |
| データが変わった時                       | ❌ 実行されない   | CSRでデータを取得して更新                           |
| リンクをクリックした時                   | ❌ 実行されない   | CSR（SPA）で実行（初回アクセス後のページ遷移）      |
| 戻るボタンを押した時                     | ❌ 実行されない   | CSR（SPA）で実行（初回アクセス後のページ遷移の後）  |
| ページ全体を再読み込みした時             | ✅ 実行される     | F5キー、Ctrl+Rなど（現在のページのSSRが実行される） |

### 本アプリでの実装箇所

ユニバーサルレンダリングは、以下の実装箇所で行われている：

#### 1. ページコンポーネント（`pages/`配下）

各ページコンポーネントで`useFetch`を使用することで、サーバーサイドとクライアントサイドの両方でデータを取得する。

**実装箇所1: `pages/index.vue`（トップページ）**

```typescript
// 54-62行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, getAuthorName } = useQuotes()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
```

**実装箇所2: `pages/quotes/index.vue`（名言一覧）**

```typescript
// 78-86行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, isLoading, error, addQuote, updateQuote, removeQuote, getAuthorName } = useQuotes()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
```

**実装箇所3: `pages/authors/index.vue`（著者一覧）**

```typescript
// 46-60行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')

const { quotes, updateQuote } = useQuotes()
const { authors, isLoading, error, getOrCreateAuthorByName } = useAuthors()
const quotesStore = useQuotesStore()
const authorsStore = useAuthorsStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  quotesStore.quotes = fetchedQuotes.value
}
if (fetchedAuthors.value) {
  authorsStore.authors = fetchedAuthors.value
}
```

**実装箇所4: `pages/authors/[id]/quotes.vue`（著者ごとの名言一覧）**

```typescript
// 50-65行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')

const { quotes, isLoading, error } = useQuotes()
const { authors, getAuthor } = useAuthors()
const quotesStore = useQuotesStore()
const authorsStore = useAuthorsStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  quotesStore.quotes = fetchedQuotes.value
}
if (fetchedAuthors.value) {
  authorsStore.authors = fetchedAuthors.value
}
```

**実装箇所5: `pages/quotes/[id].vue`（名言詳細）**

```typescript
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { quotes, getQuote, updateQuote, removeQuote, isLoading, error, getAuthorName } = useQuotes()
const store = useQuotesStore()

// サーバーサイドで取得したデータをストアに反映
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
```

#### 2. サーバーAPIルート（`server/api/`配下）

サーバーサイドでデータを取得するためのAPIエンドポイントを実装する。

**実装箇所: `server/api/quotes/index.get.ts`**

```typescript
// 1-11行目
import type { Quote } from '@/types/quote'
import { getQuotes } from '@/server/utils/quotes-storage'

/**
 * GET /api/quotes
 * 名言一覧を取得
 */
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})
```

**実装箇所: `server/api/authors/index.get.ts`**

```typescript
import type { Author } from '@/types/author'
import { getAuthors } from '~/server/utils/authors-storage'

export default defineEventHandler(async (event): Promise<Author[]> => {
  return getAuthors()
})
```

#### 3. サーバーサイドのストレージ（`server/utils/`配下）

サーバーサイドでデータを保存・取得するためのストレージを実装する。

**実装箇所: `server/utils/quotes-storage.ts`**

```typescript
// 1-30行目
import type { Quote } from '@/types/quote'

/**
 * メモリ上に名言データを保存する簡易ストレージ
 * サーバー再起動でデータは消える（学習用）
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
```

**実装箇所: `server/utils/authors-storage.ts`**

```typescript
import type { Author } from '@/types/author'

/**
 * メモリ上に著者データを保存する簡易ストレージ
 * サーバー再起動でデータは消える（学習用）
 */
let authorsStorage: Author[] = []

export function getAuthors(): Author[] {
  return [...authorsStorage]
}

export function saveAuthors(authors: Author[]): void {
  authorsStorage = [...authors]
}
```

### ユニバーサルレンダリングが行われる場所

**1. サーバーサイド（初回アクセス時）:**

- **場所**: 各ページコンポーネント（`pages/`配下）
- **実装**: `useFetch`を使用してデータを取得
- **動作**: サーバーサイドで`useFetch`が実行され、サーバーAPIルート（`server/api/`配下）が呼び出される
- **結果**: データが入ったHTMLが生成され、ブラウザに送信される

**2. クライアントサイド（ハイドレーション時）:**

- **場所**: 各ページコンポーネント（`pages/`配下）
- **実装**: 同じ`useFetch`がクライアントサイドでも実行される
- **動作**: クライアントサイドで`useFetch`が実行され、同じAPIエンドポイントが呼び出される
- **結果**: サーバーサイドで生成されたHTMLとクライアントサイドの状態が同期される（ハイドレーション）

**3. クライアントサイド（2回目以降のページ遷移時）:**

- **場所**: 各ページコンポーネント（`pages/`配下）
- **実装**: 同じ`useFetch`がクライアントサイドで実行される
- **動作**: クライアントサイドで`useFetch`が実行され、APIエンドポイントからデータを取得
- **結果**: ページ全体を再読み込みせずに、データを取得して画面を更新する（SPA）

### まとめ

ユニバーサルレンダリングは、以下の3つの場所で実装されている：

1. **ページコンポーネント（`pages/`配下）**: `useFetch`を使用してデータを取得
2. **サーバーAPIルート（`server/api/`配下）**: サーバーサイドでデータを取得するAPIエンドポイント
3. **サーバーサイドのストレージ（`server/utils/`配下）**: サーバーサイドでデータを保存・取得するストレージ

**重要なポイント:**

- `useFetch`は、サーバーサイドとクライアントサイドの両方で実行される
- サーバーサイドでは、データ取得が完了してからHTMLを生成する（SSR）
- クライアントサイドでは、同じコードが実行されてハイドレーションが行われる
- 2回目以降のページ遷移では、クライアントサイドでデータを取得して画面を更新する（SPA）

### クライアントサイドのみの処理

**実装箇所: `pages/index.vue`**

```typescript
onMounted(() => {
  // クライアントサイドでのみ実行（サーバーサイドでは既にデータを取得済み）
  pickQuote()
  // 可視状態に応じて自動切替を開始/停止
  document.addEventListener('visibilitychange', handleVisibilityChange)
  if (!document.hidden) startAutoRotate()
})
```

**動作:**

- `onMounted`はクライアントサイドでのみ実行される
- サーバーサイドでは実行されない（`document`や`window`が存在しないため）
- 自動ローテーションやイベントリスナーなど、ブラウザでのみ必要な処理を実行する

### まとめ

| 項目           | 変更前                                 | 変更後                                                    |
| -------------- | -------------------------------------- | --------------------------------------------------------- |
| **データ取得** | クライアントサイドのみ（localStorage） | サーバーサイドでも取得可能（API経由）                     |
| **初回表示**   | 遅い（JavaScriptの実行を待つ）         | 速い（サーバーでHTMLが完成）                              |
| **SEO**        | 不利（空のHTML）                       | 有利（完成したHTML）                                      |
| **ページ遷移** | ページ全体を再読み込み                 | SPA（ページ全体を再読み込みしない）                       |
| **データ保存** | localStorage（クライアント）           | サーバーメモリ（サーバー） + localStorage（クライアント） |

**本アプリの特徴:**

- ✅ サーバーサイドでデータを取得してHTMLを生成（SSR）
- ✅ クライアントサイドでも同じコードが実行される（ハイドレーション）
- ✅ 2回目以降のページ遷移はSPAとして動作（CSR）
- ✅ SEOに有利（完成したHTMLを検索エンジンが読める）

これにより、**ユニバーサルレンダリング**を実現し、初回表示が速く、SEOにも有利なアプリケーションになった。

---

### 内部API（同じNuxtアプリ内）の実装箇所

#### 1. サーバーAPIルート（APIエンドポイントの実装）

**実装箇所: `server/api/quotes/`配下**

**GET /api/quotes（一覧取得）:**

```typescript
// server/api/quotes/index.get.ts
import type { Quote } from '@/types/quote'
import { getQuotes } from '@/server/utils/quotes-storage'

/**
 * GET /api/quotes
 * 名言一覧を取得
 */
export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes()
})
```

**POST /api/quotes（新規作成）:**

```typescript
// server/api/quotes/index.post.ts
import type { Quote } from '@/types/quote'
import { generateId } from '@/utils/id'
import { getQuotes, saveQuotes } from '~/server/utils/quotes-storage'

/**
 * POST /api/quotes
 * 名言を新規作成
 */
export default defineEventHandler(async (event): Promise<Quote> => {
  const body = await readBody<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>(event)

  const quotes = getQuotes()
  const now = new Date().toISOString()
  const newQuote: Quote = {
    ...body,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }

  quotes.push(newQuote)
  saveQuotes(quotes)

  return newQuote
})
```

**その他のエンドポイント:**

- `server/api/quotes/[id].get.ts` - GET /api/quotes/:id（個別取得）
- `server/api/quotes/[id].put.ts` - PUT /api/quotes/:id（更新）
- `server/api/quotes/[id].delete.ts` - DELETE /api/quotes/:id（削除）
- `server/api/authors/index.get.ts` - GET /api/authors（著者一覧取得）

**重要なポイント:**

- これらは**同じNuxtアプリケーション内**の`server/api/`ディレクトリに実装されている
- Nuxt 3が自動的にこれらのファイルをAPIエンドポイントとして認識する
- 外部のサーバー（別のプロジェクト）ではなく、同じプロジェクト内で動作する

#### 2. データストレージ（メモリベース）

**実装箇所: `server/utils/quotes-storage.ts`**

```typescript
// server/utils/quotes-storage.ts
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
```

**重要なポイント:**

- データは**サーバーサイドのメモリ（配列）**に保存されている
- サーバー再起動でデータが消える（永続化されない）
- 外部のデータベース（Supabaseなど）を使用していない

#### 3. クライアントサイドからのAPI呼び出し

**実装箇所: 各ページコンポーネント（`pages/`配下）**

**例1: `pages/quotes/index.vue`**

```typescript
// 78-79行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
```

**例2: `pages/index.vue`**

```typescript
// 54-55行目
// サーバーサイドでもデータを取得（ユニバーサルレンダリング対応）
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
```

**例3: `pages/authors/index.vue`**

```typescript
// 47-48行目
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')
```

**重要なポイント:**

- `useFetch('/api/quotes')`を使用してAPIを呼び出している
- `/api/quotes`は、同じNuxtアプリケーション内の`server/api/quotes/index.get.ts`を指している
- 外部のサーバー（別のプロジェクト）ではなく、同じプロジェクト内のAPIを呼び出している

#### 4. データの流れ（内部APIの場合）

**SSR（サーバーサイド）での動作:**

```
1. サーバーサイドで pages/quotes/index.vue が実行される
2. useFetch('/api/quotes') が実行される（サーバーサイド）
3. Nuxt 3が server/api/quotes/index.get.ts を直接呼び出す（内部関数呼び出し）
4. getQuotes() が実行される（server/utils/quotes-storage.ts）
5. サーバー内のメモリ（quotesStorage）からデータを取得
6. データが返される（HTTPリクエストなし）
7. HTMLが生成される
```

**CSR（クライアントサイド）での動作:**

```
1. クライアントサイドで pages/quotes/index.vue が実行される
2. useFetch('/api/quotes') が実行される（クライアントサイド）
3. ブラウザが http://localhost:3000/api/quotes にHTTPリクエストを送る
4. サーバーがリクエストを受け取る（同じNuxtアプリケーション内）
5. server/api/quotes/index.get.ts が実行される
6. getQuotes() が実行される（server/utils/quotes-storage.ts）
7. サーバー内のメモリ（quotesStorage）からデータを取得
8. サーバーがJSON形式でデータを返す
9. ブラウザがデータを受け取る
```

**重要なポイント:**

- **SSRでは、HTTPリクエストを送らない**（内部関数呼び出し）
- **CSRでは、HTTPリクエストを送る**が、**同じNuxtアプリケーション内**のサーバーに送る
- 外部のサーバー（別のプロジェクト）には送らない

#### 5. なぜ「内部API」なのか？

**「内部API」と呼ばれる理由:**

1. **同じNuxtアプリケーション内で動作する**
   - `server/api/quotes/index.get.ts`は、同じプロジェクト内の`server/api/`ディレクトリに実装されている
   - 外部のサーバー（別のプロジェクト）ではない

2. **同じプロジェクトのファイルを直接参照している**
   - `server/api/quotes/index.get.ts`は、`server/utils/quotes-storage.ts`を直接インポートしている
   - 外部のAPI（別のサーバー）を呼び出していない

3. **データも同じプロジェクト内のメモリに保存されている**
   - `server/utils/quotes-storage.ts`の`quotesStorage`変数にデータを保存
   - 外部のデータベース（Supabaseなど）を使用していない

**「外部API」との違い:**

- **内部API**: 同じNuxtアプリケーション内の`server/api/`配下のファイル
- **外部API**: 別のサーバーやサービス（例: Supabase、JSONPlaceholderなど）

#### 6. まとめ

**内部API（同じNuxtアプリ内）の実装箇所:**

| 実装箇所                       | ファイル                              | 説明                            |
| ------------------------------ | ------------------------------------- | ------------------------------- |
| **サーバーAPIルート**          | `server/api/quotes/index.get.ts` など | APIエンドポイントの実装         |
| **データストレージ**           | `server/utils/quotes-storage.ts`      | メモリベースのデータ保存        |
| **クライアントからの呼び出し** | `pages/quotes/index.vue` など         | `useFetch('/api/quotes')`を使用 |

**重要なポイント:**

- これらは**同じNuxtアプリケーション内**で動作している
- 外部のサーバー（別のプロジェクト）や外部のデータベース（Supabaseなど）を使用していない
- そのため、「内部API」と呼ばれる

### `server/utils/quotes-storage.ts`の役割について

**質問:**

- `server/utils/quotes-storage.ts`は本プロジェクトではバックエンド的な役割をしているんですかね？

**答え: はい、その通りです。`server/utils/quotes-storage.ts`は、本プロジェクトでバックエンド的な役割（データストレージ層）を担っています。ただし、完全なバックエンドではありません（データが永続化されていないため）。**

#### 1. 現在の実装

**`server/utils/quotes-storage.ts`:**

```typescript
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
```

**使用箇所:**

- `server/api/quotes/index.get.ts` - `getQuotes()`を呼び出してデータを取得
- `server/api/quotes/index.post.ts` - `getQuotes()`と`saveQuotes()`を使用してデータを保存
- `server/api/quotes/[id].put.ts` - `getQuotes()`と`saveQuotes()`を使用してデータを更新
- `server/api/quotes/[id].delete.ts` - `getQuotes()`と`saveQuotes()`を使用してデータを削除

#### 2. バックエンド的な役割

**`server/utils/quotes-storage.ts`は、以下のバックエンド的な役割を担っている:**

1. **データの保存・取得**
   - `getQuotes()`: データを取得
   - `saveQuotes()`: データを保存
   - `clearQuotes()`: データをクリア

2. **データの管理**
   - サーバーサイドでデータを管理
   - クライアントサイドから直接アクセスできない（サーバーサイドのみ）

3. **データの永続化（ただし、メモリベース）**
   - データはサーバーサイドのメモリ（配列）に保存される
   - サーバー再起動でデータが消える（永続化されない）

#### 3. 完全なバックエンドとの違い

**完全なバックエンド（例: Supabase、データベース）:**

- ✅ データの永続化（サーバー再起動してもデータが残る）
- ✅ トランザクション管理
- ✅ データの整合性保証
- ✅ 本番環境でも使用可能

**現在の実装（`server/utils/quotes-storage.ts`）:**

- ❌ データの永続化（サーバー再起動でデータが消える）
- ❌ トランザクション管理（なし）
- ❌ データの整合性保証（シンプルな配列操作のみ）
- ❌ 本番環境では使用不可（学習用）

#### 4. アーキテクチャ的な位置づけ

**本プロジェクトのアーキテクチャ:**

```
【クライアントサイド（フロントエンド）】
pages/quotes/index.vue
  ↓ useFetch('/api/quotes')

【API層（サーバーサイド）】
server/api/quotes/index.get.ts
  ↓ getQuotes()

【データストレージ層（サーバーサイド）】
server/utils/quotes-storage.ts
  ↓ quotesStorage（メモリ）
```

**役割分担:**

- **フロントエンド**: ユーザーインターフェース、データの表示
- **API層**: リクエストの受け取り、データの変換、エラーハンドリング
- **データストレージ層**: データの保存・取得（バックエンド的な役割）

#### 5. Supabaseを使った場合との比較

**現在の実装（メモリベース）:**

```typescript
// server/utils/quotes-storage.ts
let quotesStorage: Quote[] = []

export function getQuotes(): Quote[] {
  return [...quotesStorage]
}
```

**Supabaseを使った場合:**

```typescript
// server/utils/quotes-storage.ts（または、直接Supabaseを呼び出す）
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export async function getQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.from('quotes').select('*')

  if (error) throw error
  return data
}
```

**違い:**

- **現在の実装**: メモリベース（サーバー再起動でデータが消える）
- **Supabase**: データベースベース（サーバー再起動してもデータが残る）

#### 6. まとめ

**`server/utils/quotes-storage.ts`の役割:**

| 項目         | 説明                                       |
| ------------ | ------------------------------------------ |
| **役割**     | データストレージ層（バックエンド的な役割） |
| **機能**     | データの保存・取得・管理                   |
| **実装**     | メモリベース（配列）                       |
| **永続化**   | ❌ サーバー再起動でデータが消える          |
| **本番環境** | ❌ 使用不可（学習用）                      |

**重要なポイント:**

- `server/utils/quotes-storage.ts`は、**バックエンド的な役割（データストレージ層）**を担っている
- ただし、**完全なバックエンドではない**（データが永続化されていないため）
- **学習用の簡易実装**である
- **本番環境では使用不可**（Supabaseなどのデータベースを使用する必要がある）

**つまり、`server/utils/quotes-storage.ts`は、本プロジェクトでバックエンド的な役割を担っているが、完全なバックエンドではなく、学習用の簡易実装である。**

### 評価項目「（非同期通信）・api routeを用いてデータフェッチ処理を実行して画面上で表示までできる」について

**評価項目:**

- （非同期通信）・api routeを用いてデータフェッチ処理を実行して画面上で表示までできる
- 【例】api routeの中でprisma等を使いDBアクセスをしてデータを取得する

**質問:**

- この評価項目に対しては、現在の内部APIの構成だと満たせませんかね？

**答え: 基本的な要件は満たしていますが、例として挙げられている「DBアクセス（Prismaなど）」は満たしていません。評価を高めるためには、DBアクセスを実装する必要があります。**

#### 1. 評価項目の要件チェック

**✅ 満たしている要件:**

1. **api routeを用いてデータフェッチ処理を実行**
   - ✅ `server/api/quotes/index.get.ts`などのAPIルートが実装されている
   - ✅ `useFetch('/api/quotes')`でデータフェッチ処理を実行している

2. **画面上で表示までできる**
   - ✅ `pages/quotes/index.vue`などでデータを取得して表示している
   - ✅ `pages/index.vue`などでもデータを取得して表示している

**❌ 満たしていない要件（例として挙げられている）:**

3. **DBアクセス（Prismaなど）**
   - ❌ 現在はメモリベースの`server/utils/quotes-storage.ts`を使用している
   - ❌ PrismaなどのORMを使用していない
   - ❌ データベース（PostgreSQL、MySQLなど）にアクセスしていない

#### 2. 現在の実装状況

**実装箇所1: APIルート**

```typescript
// server/api/quotes/index.get.ts
import type { Quote } from '@/types/quote'
import { getQuotes } from '@/server/utils/quotes-storage'

export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes() // メモリからデータを取得
})
```

**実装箇所2: データフェッチ処理**

```typescript
// pages/quotes/index.vue
const { data: fetchedQuotes } = await useFetch<Quote[]>('/api/quotes')
```

**実装箇所3: 画面表示**

```typescript
// pages/quotes/index.vue
if (fetchedQuotes.value) {
  store.quotes = fetchedQuotes.value
}
// テンプレートで表示
```

**データストレージ:**

```typescript
// server/utils/quotes-storage.ts
let quotesStorage: Quote[] = [] // メモリベース

export function getQuotes(): Quote[] {
  return [...quotesStorage]
}
```

#### 3. 評価項目の解釈

**必須要件:**

- ✅ api routeを用いてデータフェッチ処理を実行
- ✅ 画面上で表示までできる

**例として挙げられている要件:**

- ❌ DBアクセス（Prismaなど）

**評価の観点:**

- **基本的な要件は満たしている**: APIルート、データフェッチ、画面表示は実装されている
- **例として挙げられている要件は満たしていない**: DBアクセス（Prismaなど）は実装されていない
- **評価を高めるためには**: DBアクセスを実装する必要がある

#### 4. 評価を高めるための改善案

**改善案1: Prismaを使用してDBアクセスを実装する**

```typescript
// server/api/quotes/index.get.ts
import type { Quote } from '@/types/quote'
import { prisma } from '@/server/utils/prisma'

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // Prismaを使用してDBからデータを取得
  const quotes = await prisma.quote.findMany()
  return quotes
})
```

**改善案2: Supabaseを使用してDBアクセスを実装する**

```typescript
// server/api/quotes/index.get.ts
import type { Quote } from '@/types/quote'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // Supabaseを使用してDBからデータを取得
  const { data, error } = await supabase.from('quotes').select('*')

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data
})
```

#### 5. まとめ

**現在の実装の評価:**

| 要件                                          | 必須/例 | 実装状況    | 評価           |
| --------------------------------------------- | ------- | ----------- | -------------- |
| **api routeを用いてデータフェッチ処理を実行** | 必須    | ✅ 実装済み | 満たしている   |
| **画面上で表示までできる**                    | 必須    | ✅ 実装済み | 満たしている   |
| **DBアクセス（Prismaなど）**                  | 例      | ❌ 未実装   | 満たしていない |

**結論:**

- **基本的な要件は満たしている**: APIルート、データフェッチ、画面表示は実装されている
- **例として挙げられている要件は満たしていない**: DBアクセス（Prismaなど）は実装されていない
- **評価を高めるためには**: DBアクセス（Prisma、Supabaseなど）を実装する必要がある

**つまり、現在の内部APIの構成では、基本的な要件は満たしているが、例として挙げられている「DBアクセス（Prismaなど）」は満たしていない。評価を高めるためには、DBアクセスを実装する必要がある。**

### DBアクセスの実装について（Supabaseを使う場合）

**質問:**

- このDBアクセスの実装ってのはsupabase使うとかで合ってます？
- supabase使ってたらDBアクセスすることになんのかな？

**答え: はい、その通りです。Supabaseを使うことは、DBアクセスを実装することになります。SupabaseはPostgreSQLデータベースを提供するため、Supabaseを使うことでDBアクセスが実現されます。**

#### 1. Supabaseとは

**Supabaseとは:**

- **Backend as a Service（BaaS）**プラットフォームである
- **PostgreSQLデータベース**を提供する
- **REST API**を自動生成する
- **認証、ストレージ、リアルタイム機能**などを統合的に提供する

**重要なポイント:**

- Supabaseは**PostgreSQLデータベース**を提供している
- PostgreSQLは**リレーショナルデータベース**である
- つまり、Supabaseを使うことは**DBアクセス**を実装することになる

#### 2. DBアクセスとは

**DBアクセスとは:**

- **データベース**に接続してデータを取得・保存・更新・削除すること
- **データベース**とは、データを永続的に保存するシステムである

**DBアクセスの例:**

- **Prisma**: ORM（Object-Relational Mapping）を使用してDBアクセス
- **Supabase**: PostgreSQLデータベースにアクセス
- **MySQL**: MySQLデータベースにアクセス
- **MongoDB**: MongoDBデータベースにアクセス

#### 3. Supabaseを使う = DBアクセス

**Supabaseを使う場合の実装:**

```typescript
// server/api/quotes/index.get.ts
import type { Quote } from '@/types/quote'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // Supabaseを使用してDBからデータを取得
  const { data, error } = await supabase.from('quotes').select('*')

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    })
  }

  return data
})
```

**この実装は:**

- ✅ **DBアクセス**を実装している（PostgreSQLデータベースにアクセス）
- ✅ **データの永続化**が実現される（サーバー再起動してもデータが残る）
- ✅ **評価項目の例**を満たしている（「api routeの中でprisma等を使いDBアクセスをしてデータを取得する」）

#### 4. 現在の実装との比較

**現在の実装（メモリベース）:**

```typescript
// server/api/quotes/index.get.ts
import { getQuotes } from '@/server/utils/quotes-storage'

export default defineEventHandler(async (event): Promise<Quote[]> => {
  return getQuotes() // メモリからデータを取得（DBアクセスではない）
})
```

**Supabaseを使った実装（DBアクセス）:**

```typescript
// server/api/quotes/index.get.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // PostgreSQLデータベースからデータを取得（DBアクセス）
  const { data, error } = await supabase.from('quotes').select('*')

  return data
})
```

**違い:**

- **現在の実装**: メモリからデータを取得（DBアクセスではない）
- **Supabaseを使った実装**: PostgreSQLデータベースからデータを取得（DBアクセス）

#### 5. 評価項目との関係

**評価項目:**

- （非同期通信）・api routeを用いてデータフェッチ処理を実行して画面上で表示までできる
- 【例】api routeの中でprisma等を使いDBアクセスをしてデータを取得する

**Supabaseを使った場合:**

- ✅ **api routeを用いてデータフェッチ処理を実行** → 満たしている
- ✅ **画面上で表示までできる** → 満たしている
- ✅ **DBアクセスをしてデータを取得** → 満たしている（Supabase = PostgreSQLデータベース）

**つまり、Supabaseを使うことで、評価項目の例として挙げられている「DBアクセス」を実装することができる。**

#### 6. PrismaとSupabaseの違い

**Prismaを使った場合:**

```typescript
// server/api/quotes/index.get.ts
import { prisma } from '@/server/utils/prisma'

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // Prismaを使用してDBからデータを取得
  const quotes = await prisma.quote.findMany()
  return quotes
})
```

**Supabaseを使った場合:**

```typescript
// server/api/quotes/index.get.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export default defineEventHandler(async (event): Promise<Quote[]> => {
  // Supabaseを使用してDBからデータを取得
  const { data, error } = await supabase.from('quotes').select('*')

  return data
})
```

**違い:**

- **Prisma**: ORM（Object-Relational Mapping）を使用してDBアクセス
- **Supabase**: PostgreSQLデータベースを提供するBaaSを使用してDBアクセス
- **どちらもDBアクセスを実装している**

#### 7. まとめ

**Supabaseを使う = DBアクセス:**

| 項目                   | 説明                                                         |
| ---------------------- | ------------------------------------------------------------ |
| **Supabaseとは**       | PostgreSQLデータベースを提供するBaaS                         |
| **DBアクセスとは**     | データベースに接続してデータを取得・保存・更新・削除すること |
| **Supabaseを使うこと** | PostgreSQLデータベースにアクセスすること = DBアクセス        |

**評価項目との関係:**

- ✅ **Supabaseを使うことで、評価項目の例として挙げられている「DBアクセス」を実装できる**
- ✅ **「api routeの中でprisma等を使いDBアクセスをしてデータを取得する」の「prisma等」には、Supabaseも含まれる**

**重要なポイント:**

- **Supabaseを使うことは、DBアクセスを実装することになる**
- **SupabaseはPostgreSQLデータベースを提供しているため、DBアクセスである**
- **評価項目の例として挙げられている「DBアクセス」は、Supabaseを使うことで満たすことができる**

**つまり、Supabaseを使うことで、DBアクセスを実装することができ、評価項目の例として挙げられている要件を満たすことができる。**

**自分的によく学んどいた方がいいと思うこと**

- Vue2とVue3の大きな違いは？
- そもそもTypeScriptがいいってなってるのはなんでなの？
- Vue3のライフサイクルフック
  - Vue2との違いは？
  - 各ライフサイクルフックで入れるべき処理で代表的なもの

---

## CRUD操作の流れ（ファイルベース）

本プロジェクトにおけるCRUD操作の流れを、各操作ごとにファイルベースで整理します。

### Quotes（名言）のCRUD操作

#### CREATE（作成）

**操作の流れ:**

```
1. ユーザー操作
   pages/quotes/index.vue（または他のページ）
   ↓ フォームに入力して「保存」ボタンをクリック

2. ページコンポーネント
   pages/quotes/index.vue
   - handleSubmit() 関数が実行される
   - addQuote(formValue) を呼び出す

3. Composable
   composables/useQuotes.ts
   - useQuotes() が addQuote を返す
   - store.addQuote(quote) を呼び出す

4. Store（Pinia）
   stores/quotes.ts
   - useQuotesStore.addQuote(quote)
   - repository.add(quote) を呼び出す
   - 成功後、quotes.value.push(newQuote) でストアを更新

5. Repository Factory
   repositories/factory.ts
   - createQuoteRepository() が実行される
   - 環境変数に応じて ApiQuoteRepository または LocalQuoteRepository を返す

6. Repository（API使用時）
   repositories/ApiQuoteRepository.ts
   - ApiQuoteRepository.add(quote)
   - $fetch('/api/quotes', { method: 'POST', body: quote }) を実行

7. サーバーAPIルート
   server/api/quotes/index.post.ts
   - defineEventHandler がリクエストを受け取る
   - readBody<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>(event) でリクエストボディを取得
   - createSupabaseClient() でSupabaseクライアントを作成
   - authorIdが指定されている場合、authorsテーブルから著者名を取得
   - generateId() でIDを生成
   - Supabaseの形式（created_at, updated_at, author_id）に変換
   - supabase.from('quotes').insert([supabaseQuote]).select().single() でデータを挿入
   - アプリの形式（createdAt, updatedAt, authorId）に変換して返す

8. Supabase
   - PostgreSQLデータベースにデータを保存
   - 保存されたデータを返す

9. レスポンスの流れ
   Supabase → server/api/quotes/index.post.ts → repositories/ApiQuoteRepository.ts → stores/quotes.ts → composables/useQuotes.ts → pages/quotes/index.vue
```

**関連ファイル:**

- `pages/quotes/index.vue` - ユーザーインターフェース、フォーム表示
- `components/QuoteForm.vue` - フォームコンポーネント
- `composables/useQuotes.ts` - Composable関数
- `stores/quotes.ts` - Piniaストア
- `repositories/factory.ts` - Repositoryファクトリー
- `repositories/ApiQuoteRepository.ts` - API用Repository実装
- `repositories/QuoteRepository.ts` - Repositoryインターフェース
- `server/api/quotes/index.post.ts` - POST APIエンドポイント
- `server/utils/supabase.server.ts` - Supabaseクライアント作成
- `utils/id.ts` - ID生成ユーティリティ

#### READ（読み取り）

**操作の流れ（一覧取得）:**

```
1. ページアクセス
   pages/quotes/index.vue（または他のページ）
   ↓ ページが読み込まれる

2. サーバーサイド（SSR）
   pages/quotes/index.vue
   - useFetch<Quote[]>('/api/quotes') が実行される（サーバーサイド）
   - Nuxt 3が自動的に server/api/quotes/index.get.ts を呼び出す

3. サーバーAPIルート
   server/api/quotes/index.get.ts
   - defineEventHandler が実行される
   - createSupabaseClient() でSupabaseクライアントを作成
   - supabase.from('quotes').select('*').order('created_at', { ascending: false }) でデータを取得
   - Supabaseの形式（created_at, updated_at, author_id）をアプリの形式（createdAt, updatedAt, authorId）に変換
   - データを返す

4. Supabase
   - PostgreSQLデータベースからデータを取得
   - データを返す

5. クライアントサイド（CSR）
   pages/quotes/index.vue
   - useFetch<Quote[]>('/api/quotes') が実行される（クライアントサイド）
   - HTTPリクエストで /api/quotes エンドポイントを呼び出す
   - サーバーAPIルートが実行される（上記と同じ）
   - 取得したデータを store.quotes に反映

6. Store（Pinia）
   stores/quotes.ts
   - quotes.value が更新される
   - 画面に自動的に反映される（リアクティビティ）
```

**操作の流れ（個別取得）:**

```
1. ページアクセス
   pages/quotes/[id].vue
   ↓ 動的ルートでページが読み込まれる

2. ページコンポーネント
   pages/quotes/[id].vue
   - useRoute() で route.params.id を取得
   - useQuotes() で getQuote(id) を呼び出す

3. Composable
   composables/useQuotes.ts
   - store.getQuote(id) を呼び出す

4. Store（Pinia）
   stores/quotes.ts
   - useQuotesStore.getQuote(id)
   - quotes.value.find((q) => q.id === id) でストアから取得
   - または、repository.get(id) を呼び出す（ストアにない場合）

5. Repository（API使用時）
   repositories/ApiQuoteRepository.ts
   - ApiQuoteRepository.get(id)
   - $fetch(`/api/quotes/${id}`, { method: 'GET' }) を実行

6. サーバーAPIルート
   server/api/quotes/[id].get.ts
   - defineEventHandler がリクエストを受け取る
   - getRouterParam(event, 'id') でIDを取得
   - createSupabaseClient() でSupabaseクライアントを作成
   - supabase.from('quotes').select('*').eq('id', id).single() でデータを取得
   - エラーハンドリング（404など）
   - Supabaseの形式をアプリの形式に変換して返す

7. Supabase
   - PostgreSQLデータベースから指定IDのデータを取得
   - データを返す
```

**関連ファイル:**

- `pages/quotes/index.vue` - 一覧ページ
- `pages/quotes/[id].vue` - 詳細ページ
- `composables/useQuotes.ts` - Composable関数
- `stores/quotes.ts` - Piniaストア
- `repositories/ApiQuoteRepository.ts` - API用Repository実装
- `server/api/quotes/index.get.ts` - GET /api/quotes エンドポイント（一覧取得）
- `server/api/quotes/[id].get.ts` - GET /api/quotes/:id エンドポイント（個別取得）
- `server/utils/supabase.server.ts` - Supabaseクライアント作成

#### UPDATE（更新）

**操作の流れ:**

```
1. ユーザー操作
   pages/quotes/index.vue（または他のページ）
   ↓ 「編集」ボタンをクリック

2. ページコンポーネント
   pages/quotes/index.vue
   - startEdit(quote) 関数が実行される
   - editingQuote.value = quote で編集対象を設定
   - form に quote の値を設定

3. ユーザー操作
   ↓ フォームを編集して「保存」ボタンをクリック

4. ページコンポーネント
   pages/quotes/index.vue
   - handleSubmit() 関数が実行される
   - updateQuote(editingQuote.value.id, formValue) を呼び出す

5. Composable
   composables/useQuotes.ts
   - store.updateQuote(id, updates) を呼び出す

6. Store（Pinia）
   stores/quotes.ts
   - useQuotesStore.updateQuote(id, updates)
   - repository.update(id, updates) を呼び出す
   - 成功後、quotes.value[index] = updated でストアを更新

7. Repository（API使用時）
   repositories/ApiQuoteRepository.ts
   - ApiQuoteRepository.update(id, updates)
   - $fetch(`/api/quotes/${id}`, { method: 'PUT', body: updates }) を実行

8. サーバーAPIルート
   server/api/quotes/[id].put.ts
   - defineEventHandler がリクエストを受け取る
   - getRouterParam(event, 'id') でIDを取得
   - readBody<Partial<Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>>>(event) でリクエストボディを取得
   - createSupabaseClient() でSupabaseクライアントを作成
   - authorIdが指定されている場合、authorsテーブルから著者名を取得
   - アプリの形式（authorId）をSupabaseの形式（author_id）に変換
   - updated_at を現在時刻に更新
   - supabase.from('quotes').update(updateData).eq('id', id).select().single() でデータを更新
   - エラーハンドリング（404など）
   - Supabaseの形式をアプリの形式に変換して返す

9. Supabase
   - PostgreSQLデータベースのデータを更新
   - 更新されたデータを返す
```

**関連ファイル:**

- `pages/quotes/index.vue` - 編集UI
- `components/QuoteForm.vue` - フォームコンポーネント
- `composables/useQuotes.ts` - Composable関数
- `stores/quotes.ts` - Piniaストア
- `repositories/ApiQuoteRepository.ts` - API用Repository実装
- `server/api/quotes/[id].put.ts` - PUT /api/quotes/:id エンドポイント
- `server/utils/supabase.server.ts` - Supabaseクライアント作成

#### DELETE（削除）

**操作の流れ:**

```
1. ユーザー操作
   pages/quotes/index.vue（または他のページ）
   ↓ 「削除」ボタンをクリック

2. ページコンポーネント
   pages/quotes/index.vue
   - handleDelete(quote.id) 関数が実行される
   - 確認ダイアログを表示（必要に応じて）
   - removeQuote(quote.id) を呼び出す

3. Composable
   composables/useQuotes.ts
   - store.removeQuote(id) を呼び出す

4. Store（Pinia）
   stores/quotes.ts
   - useQuotesStore.removeQuote(id)
   - repository.remove(id) を呼び出す
   - 成功後、quotes.value = quotes.value.filter((q) => q.id !== id) でストアを更新

5. Repository（API使用時）
   repositories/ApiQuoteRepository.ts
   - ApiQuoteRepository.remove(id)
   - $fetch(`/api/quotes/${id}`, { method: 'DELETE' }) を実行

6. サーバーAPIルート
   server/api/quotes/[id].delete.ts
   - defineEventHandler がリクエストを受け取る
   - getRouterParam(event, 'id') でIDを取得
   - createSupabaseClient() でSupabaseクライアントを作成
   - 削除前に存在確認を行う（supabase.from('quotes').select('id').eq('id', id).single()）
   - エラーハンドリング（404など）
   - supabase.from('quotes').delete().eq('id', id) でデータを削除

7. Supabase
   - PostgreSQLデータベースからデータを削除
   - 削除が完了する
```

**関連ファイル:**

- `pages/quotes/index.vue` - 削除UI
- `composables/useQuotes.ts` - Composable関数
- `stores/quotes.ts` - Piniaストア
- `repositories/ApiQuoteRepository.ts` - API用Repository実装
- `server/api/quotes/[id].delete.ts` - DELETE /api/quotes/:id エンドポイント
- `server/utils/supabase.server.ts` - Supabaseクライアント作成

### Authors（著者）のCRUD操作

#### CREATE（作成）

**操作の流れ:**

```
1. ユーザー操作
   pages/authors/index.vue（または他のページ）
   ↓ フォームに入力して「保存」ボタンをクリック

2. ページコンポーネント
   pages/authors/index.vue
   - handleSubmit() 関数が実行される
   - addAuthor(formValue) を呼び出す

3. Composable
   composables/useAuthors.ts
   - useAuthors() が addAuthor を返す
   - store.addAuthor(author) を呼び出す

4. Store（Pinia）
   stores/authors.ts
   - useAuthorsStore.addAuthor(author)
   - repository.add(author) を呼び出す
   - 成功後、authors.value.push(newAuthor) でストアを更新

5. Repository Factory
   repositories/factory.ts
   - createAuthorRepository() が実行される
   - 環境変数に応じて ApiAuthorRepository または LocalAuthorRepository を返す

6. Repository（API使用時）
   repositories/ApiAuthorRepository.ts
   - ApiAuthorRepository.add(author)
   - $fetch('/api/authors', { method: 'POST', body: author }) を実行

7. サーバーAPIルート
   server/api/authors/index.post.ts
   - defineEventHandler がリクエストを受け取る
   - readBody<Omit<Author, 'id' | 'createdAt' | 'updatedAt'>>(event) でリクエストボディを取得
   - createSupabaseClient() でSupabaseクライアントを作成
   - generateId() でIDを生成
   - Supabaseの形式（created_at, updated_at）に変換
   - supabase.from('authors').insert([supabaseAuthor]).select().single() でデータを挿入
   - アプリの形式（createdAt, updatedAt）に変換して返す

8. Supabase
   - PostgreSQLデータベースにデータを保存
   - 保存されたデータを返す
```

**関連ファイル:**

- `pages/authors/index.vue` - ユーザーインターフェース
- `composables/useAuthors.ts` - Composable関数
- `stores/authors.ts` - Piniaストア
- `repositories/factory.ts` - Repositoryファクトリー
- `repositories/ApiAuthorRepository.ts` - API用Repository実装
- `repositories/AuthorRepository.ts` - Repositoryインターフェース
- `server/api/authors/index.post.ts` - POST /api/authors エンドポイント
- `server/utils/supabase.server.ts` - Supabaseクライアント作成
- `utils/id.ts` - ID生成ユーティリティ

#### READ（読み取り）

**操作の流れ（一覧取得）:**

```
1. ページアクセス
   pages/authors/index.vue（または他のページ）
   ↓ ページが読み込まれる

2. サーバーサイド（SSR）
   pages/authors/index.vue
   - useFetch<Author[]>('/api/authors') が実行される（サーバーサイド）
   - Nuxt 3が自動的に server/api/authors/index.get.ts を呼び出す

3. サーバーAPIルート
   server/api/authors/index.get.ts
   - defineEventHandler が実行される
   - createSupabaseClient() でSupabaseクライアントを作成
   - supabase.from('authors').select('*').order('created_at', { ascending: false }) でデータを取得
   - Supabaseの形式（created_at, updated_at）をアプリの形式（createdAt, updatedAt）に変換
   - データを返す

4. Supabase
   - PostgreSQLデータベースからデータを取得
   - データを返す

5. クライアントサイド（CSR）
   pages/authors/index.vue
   - useFetch<Author[]>('/api/authors') が実行される（クライアントサイド）
   - HTTPリクエストで /api/authors エンドポイントを呼び出す
   - サーバーAPIルートが実行される（上記と同じ）
   - 取得したデータを store.authors に反映

6. Store（Pinia）
   stores/authors.ts
   - authors.value が更新される
   - 画面に自動的に反映される（リアクティビティ）
```

**関連ファイル:**

- `pages/authors/index.vue` - 一覧ページ
- `composables/useAuthors.ts` - Composable関数
- `stores/authors.ts` - Piniaストア
- `repositories/ApiAuthorRepository.ts` - API用Repository実装
- `server/api/authors/index.get.ts` - GET /api/authors エンドポイント
- `server/utils/supabase.server.ts` - Supabaseクライアント作成

### データの流れのまとめ

**レイヤー構造:**

```
┌─────────────────────────────────────────┐
│ 1. Presentation Layer（プレゼンテーション層）│
│    - pages/*.vue（ページコンポーネント）    │
│    - components/*.vue（UIコンポーネント）   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. Composable Layer（Composable層）      │
│    - composables/useQuotes.ts           │
│    - composables/useAuthors.ts           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. State Management Layer（状態管理層）  │
│    - stores/quotes.ts（Piniaストア）     │
│    - stores/authors.ts（Piniaストア）    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. Repository Factory Layer（ファクトリー層）│
│    - repositories/factory.ts            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. Repository Layer（Repository層）    │
│    - repositories/ApiQuoteRepository.ts  │
│    - repositories/ApiAuthorRepository.ts │
│    - repositories/LocalQuoteRepository.ts│
│    - repositories/LocalAuthorRepository.ts│
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. API Layer（API層）                   │
│    - server/api/quotes/*.ts             │
│    - server/api/authors/*.ts            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 7. Database Layer（データベース層）      │
│    - Supabase（PostgreSQL）             │
└─────────────────────────────────────────┘
```

**各レイヤーの役割:**

1. **Presentation Layer**: ユーザーインターフェース、フォーム表示、イベントハンドリング
2. **Composable Layer**: ビジネスロジックの再利用可能な関数、Storeへのアクセス
3. **State Management Layer**: アプリケーションの状態管理、データの永続化
4. **Repository Factory Layer**: 環境に応じたRepositoryの生成
5. **Repository Layer**: データアクセスの抽象化、API呼び出しまたはlocalStorage操作
6. **API Layer**: サーバーサイドのAPIエンドポイント、データの変換、エラーハンドリング
7. **Database Layer**: データの永続化、PostgreSQLデータベース

**データ変換のポイント:**

- **アプリの形式 → Supabaseの形式**: `createdAt` → `created_at`, `authorId` → `author_id`
- **Supabaseの形式 → アプリの形式**: `created_at` → `createdAt`, `author_id` → `authorId`
- 変換は主に `server/api/*.ts` で行われる

---

## CSSフレームワークの導入（Tailwind CSS）

**評価項目:**

- アプリケーションにCSSフレームワークを導入することができる
- 導入したフレームワークで推奨されるコンポーネントのスタイリングをドキュメントを参照し実装することができる

### Tailwind CSSとは

**Tailwind CSS**は、ユーティリティファーストのCSSフレームワークです。従来のCSSフレームワーク（Bootstrapなど）とは異なり、あらかじめ定義されたコンポーネントクラスではなく、小さなユーティリティクラスを組み合わせてスタイルを構築します。

**特徴:**

- **ユーティリティファースト**: 小さなクラスを組み合わせてスタイルを構築
- **カスタマイズ可能**: `tailwind.config.js`でテーマをカスタマイズ可能
- **レスポンシブ対応**: `md:`, `lg:`などのプレフィックスで簡単にレスポンシブ対応
- **ダークモード対応**: `dark:`プレフィックスでダークモード対応
- **パージ機能**: 使用されていないCSSを自動的に削除してバンドルサイズを最適化

### 1. パッケージのインストール

**実装箇所: `package.json`**

```json
{
  "devDependencies": {
    "@nuxtjs/tailwindcss": "^6.14.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

`@nuxtjs/tailwindcss`は、Nuxt.js用のTailwind CSSモジュールです。これにより、Nuxt.jsプロジェクトで簡単にTailwind CSSを使用できます。

**インストールコマンド:**

```bash
npm install -D @nuxtjs/tailwindcss autoprefixer postcss
```

### 2. Nuxtモジュールの登録

**実装箇所: `nuxt.config.ts`**

```typescript
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  // ...
})
```

`modules`配列に`@nuxtjs/tailwindcss`を追加することで、Tailwind CSSが自動的に有効化されます。これが**CSSフレームワークを導入する**という評価項目に該当する主要な実装箇所です。

### 3. Tailwind設定ファイルの作成

**実装箇所: `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**重要な設定:**

- **`content`**: Tailwind CSSがクラスを検索するファイルパスを指定。これにより、使用されていないCSSが自動的に削除されます（パージ機能）
- **`theme.extend`**: デフォルトのテーマを拡張する設定。カスタムカラーやブレークポイントを追加可能

### 4. 実際の使用例

**実装箇所: `components/QuoteForm.vue`**

#### 4.1. タイポグラフィ（文字サイズ・太さ）

```vue
<h2 class="formTitle text-xl md:text-2xl font-semibold">
  {{ isEditMode ? '編集' : '新規追加' }}
</h2>
```

**使用しているクラス:**

- `text-xl`: フォントサイズを`1.25rem`（20px）に設定
- `md:text-2xl`: タブレット以上（768px以上）でフォントサイズを`1.5rem`（24px）に設定
- `font-semibold`: フォントの太さを600に設定

#### 4.2. レイアウト（Flexbox）

```vue
<div class="formActions flex flex-col md:flex-row gap-3 md:gap-4">
  <button type="submit" class="button ...">
    追加
  </button>
  <button type="button" class="button buttonSecondary ...">
    キャンセル
  </button>
</div>
```

**使用しているクラス:**

- `flex`: Flexboxレイアウトを有効化
- `flex-col`: フレックス方向を縦（column）に設定（モバイル）
- `md:flex-row`: タブレット以上でフレックス方向を横（row）に設定
- `gap-3`: 要素間の間隔を`0.75rem`（12px）に設定
- `md:gap-4`: タブレット以上で間隔を`1rem`（16px）に設定

#### 4.3. フォーム要素のスタイリング

```vue
<textarea
  class="input block w-full rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
  ...
/>
```

**使用しているクラス:**

- `block`: ブロック要素として表示
- `w-full`: 幅を100%に設定
- `rounded-md`: 角丸を`0.375rem`（6px）に設定
- `shadow-sm`: 小さな影を追加
- `transition-colors`: 色の変化にトランジション効果を追加
- `focus:outline-none`: フォーカス時のアウトラインを削除
- `focus:ring-2`: フォーカス時にリング（輪郭）を2px追加
- `focus:ring-offset-0`: リングのオフセットを0に設定

#### 4.4. ボタンのスタイリング

```vue
<button
  type="submit"
  class="button inline-flex justify-center items-center px-8 py-3.5 border-transparent text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
>
  追加
</button>
```

**使用しているクラス:**

- `inline-flex`: インラインフレックスボックスとして表示
- `justify-center`: 主軸方向（横）の中央揃え
- `items-center`: 交差軸方向（縦）の中央揃え
- `px-8`: 左右のパディングを`2rem`（32px）に設定
- `py-3.5`: 上下のパディングを`0.875rem`（14px）に設定
- `border-transparent`: ボーダーを透明に設定
- `text-base`: フォントサイズを`1rem`（16px）に設定
- `font-medium`: フォントの太さを500に設定

### 5. Tailwind CSSと既存のSCSSの組み合わせ

本プロジェクトでは、Tailwind CSSのユーティリティクラスと既存のSCSSスタイルを組み合わせて使用しています。

**実装方針:**

- **Tailwind CSS**: レイアウト、スペーシング、タイポグラフィ、レスポンシブ対応など
- **SCSS**: テーマカラー（CSS変数）、カスタムスタイル、ミックスインなど

**例: `components/QuoteForm.vue`**

```vue
<template>
  <!-- Tailwind CSSのユーティリティクラスと既存のSCSSスタイルを組み合わせ -->
  <div class="formCard shadow-sm">
    <!-- Tailwindクラス: shadow-sm -->
    <!-- SCSSクラス: formCard（カスタムスタイル） -->
  </div>
</template>

<style scoped lang="scss">
.formCard {
  background-color: var(--color-surface); // CSS変数を使用
  border: 1px solid var(--color-border);
  padding: 1.5rem;
}
</style>
```

### 6. レスポンシブデザインとの連携

Tailwind CSSのレスポンシブプレフィックス（`md:`, `lg:`など）と、既存のSCSS変数（`$breakpoint-tablet`）を組み合わせて使用しています。

**Tailwind CSSのブレークポイント:**

- `sm:`: 640px以上
- `md:`: 768px以上（`$breakpoint-tablet: 769px`とほぼ同じ）
- `lg:`: 1024px以上（`$breakpoint-desktop: 1025px`とほぼ同じ）
- `xl:`: 1280px以上
- `2xl:`: 1536px以上

### 7. 評価項目との関係

**評価項目「アプリケーションにCSSフレームワークを導入することができる」に該当する実装:**

1. ✅ **`package.json`にパッケージ追加**: `@nuxtjs/tailwindcss`を追加
2. ✅ **`nuxt.config.ts`でモジュール登録**: `modules`配列に`@nuxtjs/tailwindcss`を追加（**主要な実装箇所**）
3. ✅ **`tailwind.config.js`で設定**: Tailwind CSSの設定ファイルを作成
4. ✅ **実際に使用**: コンポーネントでTailwind CSSのユーティリティクラスを使用

**評価項目「導入したフレームワークで推奨されるコンポーネントのスタイリングをドキュメントを参照し実装することができる」に該当する実装:**

1. ✅ **Tailwind CSS公式ドキュメントを参照**: コメントにドキュメントURLを記載
2. ✅ **ユーティリティクラスを組み合わせて実装**: `flex`, `gap`, `rounded-md`, `shadow-sm`などを組み合わせ
3. ✅ **レスポンシブ対応**: `md:flex-row`, `md:text-2xl`などのレスポンシブプレフィックスを使用
4. ✅ **フォーカス状態のスタイリング**: `focus:ring-2`, `focus:outline-none`など、Tailwind CSS推奨のフォーカススタイルを実装

### 8. 参考リンク

- **Tailwind CSS公式ドキュメント**: https://tailwindcss.com/docs
- **Nuxt Tailwind CSSモジュール**: https://tailwindcss.nuxtjs.org/

### 9. まとめ

Tailwind CSSを導入することで、以下のメリットが得られます：

1. **開発速度の向上**: 小さなユーティリティクラスを組み合わせるだけで、素早くスタイルを構築できる
2. **一貫性の確保**: デザインシステムに基づいた一貫したスタイルを適用できる
3. **レスポンシブ対応の簡素化**: プレフィックスを追加するだけでレスポンシブ対応が可能
4. **バンドルサイズの最適化**: 使用されていないCSSが自動的に削除される
5. **カスタマイズ性**: `tailwind.config.js`でテーマを自由にカスタマイズできる

**重要なポイント:**

- **`nuxt.config.ts`の`modules`配列への追加が、CSSフレームワーク導入の明確な証拠**
- **Tailwind CSSはユーティリティファーストのアプローチを採用しているため、コンポーネントクラスではなく、ユーティリティクラスを組み合わせて実装する**

---

## ESLint / Prettier等の静的コード解析ツールとpre-commitの設定

**評価項目:**

- ESLint / Prettier等の静的コード解析ツールをアプリケーションに導入した上で、pre-commitの設定ができる

### 1. ESLintの導入と設定

#### 1.1. 依存関係の追加

**実装箇所: `package.json`**

```json
{
  "devDependencies": {
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.1",
    "@typescript-eslint/parser": "^6.19.1",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-vue": "^9.20.0"
  }
}
```

**各パッケージの役割:**

- `eslint`: ESLintのコアライブラリ
- `@typescript-eslint/eslint-plugin`: TypeScript用のESLintルール
- `@typescript-eslint/parser`: TypeScriptコードを解析するパーサー
- `eslint-config-prettier`: Prettierと競合するESLintルールを無効化
- `eslint-plugin-vue`: Vue.js用のESLintルール

#### 1.2. ESLint設定ファイル

**実装箇所: `.eslintrc.cjs`**

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
}
```

**設定の説明:**

- `root: true`: このディレクトリがESLint設定のルートであることを示す
- `env`: 実行環境を指定（ブラウザ、ES2021、Node.js）
- `extends`: 使用するルールセットを指定
  - `eslint:recommended`: ESLintの推奨ルール
  - `plugin:@typescript-eslint/recommended`: TypeScriptの推奨ルール
  - `plugin:vue/vue3-recommended`: Vue 3の推奨ルール
  - `prettier`: Prettierと競合するルールを無効化
- `parser`: Vueファイルを解析するパーサー
- `parserOptions.parser`: TypeScriptコードを解析するパーサー
- `rules`: カスタムルールの設定（`vue/multi-word-component-names`を無効化）

#### 1.3. ESLint実行スクリプト

**実装箇所: `package.json`**

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

**使用方法:**

```bash
npm run lint
```

### 2. Prettierの導入と設定

#### 2.1. 依存関係の追加

**実装箇所: `package.json`**

```json
{
  "devDependencies": {
    "prettier": "^3.2.4"
  }
}
```

#### 2.2. Prettier設定ファイル

**実装箇所: `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**設定の説明:**

- `semi: false`: セミコロンを付けない
- `singleQuote: true`: シングルクォートを使用
- `printWidth: 100`: 1行の最大文字数を100文字に設定
- `tabWidth: 2`: インデントを2スペースに設定
- `trailingComma: "es5"`: ES5で有効な箇所に末尾カンマを付ける

#### 2.3. Prettier実行スクリプト

**実装箇所: `package.json`**

```json
{
  "scripts": {
    "format": "prettier --write ."
  }
}
```

**使用方法:**

```bash
npm run format
```

### 3. pre-commitの設定（husky + lint-staged）

#### 3.1. 依存関係の追加

**実装箇所: `package.json`**

```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^15.5.2"
  }
}
```

**各パッケージの役割:**

- `husky`: Gitフックを管理するツール
- `lint-staged`: ステージングされたファイルのみに対してlintを実行するツール

#### 3.2. huskyの初期化

**実装箇所: `package.json`**

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

**動作:**

- `npm install`実行時に自動的に`husky`が初期化される
- `.husky`ディレクトリが作成される

**初期化コマンド（初回のみ）:**

```bash
npx husky init
```

#### 3.3. pre-commitフックの作成

**実装箇所: `.husky/pre-commit`**

```
npx lint-staged
```

**動作:**

- Gitコミット時に自動的に実行される
- `lint-staged`を実行して、ステージングされたファイルに対してlintとformatを実行

#### 3.4. lint-stagedの設定

**実装箇所: `package.json`**

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{json,md,scss,css,html,yml,yaml,tsx,jsx}": ["prettier --write"]
  }
}
```

**設定の説明:**

- `*.{js,ts,vue}`: JavaScript、TypeScript、Vueファイルに対して
  - `eslint --fix`: ESLintの自動修正を実行
  - `prettier --write`: Prettierでフォーマット
- `*.{json,md,scss,css,html,yml,yaml,tsx,jsx}`: その他のファイルに対して
  - `prettier --write`: Prettierでフォーマットのみ

### 4. 動作の流れ

#### 4.1. コミット時の動作

```
1. ユーザーが git commit を実行
   ↓
2. Gitがpre-commitフックを実行
   ↓
3. .husky/pre-commit が実行される
   ↓
4. npx lint-staged が実行される
   ↓
5. lint-stagedがpackage.jsonの設定を読み込む
   ↓
6. ステージングされたファイルに対して:
   - *.{js,ts,vue} → eslint --fix → prettier --write
   - *.{json,md,...} → prettier --write
   ↓
7. エラーがある場合:
   - コミットが中断される
   - エラーメッセージが表示される
   ↓
8. エラーがない場合:
   - コミットが続行される
```

#### 4.2. 手動での実行

**ESLintのみ実行:**

```bash
npm run lint
```

**Prettierのみ実行:**

```bash
npm run format
```

**両方を実行:**

```bash
npm run lint && npm run format
```

### 5. 実装ファイル一覧

| ファイル            | 役割                                  |
| ------------------- | ------------------------------------- |
| `.eslintrc.cjs`     | ESLintの設定ファイル                  |
| `.prettierrc`       | Prettierの設定ファイル                |
| `.husky/pre-commit` | pre-commitフックの実装                |
| `package.json`      | 依存関係、スクリプト、lint-staged設定 |

### 6. 評価項目との関係

**評価項目「ESLint / Prettier等の静的コード解析ツールをアプリケーションに導入した上で、pre-commitの設定ができる」に該当する実装:**

1. ✅ **ESLintの導入**
   - `package.json`にESLint関連の依存関係を追加
   - `.eslintrc.cjs`でESLintの設定を実装
   - `npm run lint`スクリプトを追加

2. ✅ **Prettierの導入**
   - `package.json`にPrettierの依存関係を追加
   - `.prettierrc`でPrettierの設定を実装
   - `npm run format`スクリプトを追加
   - `eslint-config-prettier`でESLintとPrettierの競合を解消

3. ✅ **pre-commitの設定**
   - `package.json`にhuskyとlint-stagedの依存関係を追加
   - `package.json`の`prepare`スクリプトでhuskyを初期化
   - `.husky/pre-commit`でpre-commitフックを実装
   - `package.json`の`lint-staged`設定で、ステージングされたファイルに対してlintとformatを実行

### 7. 重要なポイント

**ESLintとPrettierの連携:**

- `eslint-config-prettier`を使用することで、Prettierと競合するESLintルールを無効化
- `.eslintrc.cjs`の`extends`に`'prettier'`を追加することで、競合を解消

**pre-commitフックのメリット:**

- コミット前に自動的にコード品質チェックが実行される
- チーム全体でコードスタイルが統一される
- エラーがあるコードがコミットされることを防ぐ

**lint-stagedのメリット:**

- ステージングされたファイルのみを対象とするため、高速に動作する
- 変更されていないファイルに対してlintを実行しないため、効率的

**huskyの動作:**

- `npm install`時に自動的に`prepare`スクリプトが実行される
- `.husky`ディレクトリがGitリポジトリに含まれることで、チーム全体で同じフック設定を共有できる

### 8. トラブルシューティング

**pre-commitフックが実行されない場合:**

```bash
# huskyを再初期化
npx husky init

# .husky/pre-commitファイルの実行権限を確認
chmod +x .husky/pre-commit
```

**lint-stagedが動作しない場合:**

- `package.json`の`lint-staged`設定を確認
- ファイルパターンが正しいか確認（`*.{js,ts,vue}`など）

**ESLintとPrettierの競合が発生する場合:**

- `.eslintrc.cjs`の`extends`に`'prettier'`が含まれているか確認
- `eslint-config-prettier`がインストールされているか確認

---

## モジュールバンドラーの基本的な概念と実装

**評価項目:**

- モジュールバンドラーの基本的な概念について理解している
- 様々なモジュールのファイル形式（CommonJS、ES6、AMDなど）をサポートし、アプリケーション内のモジュール間の依存関係を解決し、一つのファイルにまとめる
- クライアントが必要とするすべてのファイルを個別に呼び出す必要がなくなり、Webページの読み込み速度が改善される
- モジュールバンドラーがない場合のペインポイントを説明できる

### 1. モジュールバンドラーとは

**モジュールバンドラー**とは、複数のモジュールファイルを解析し、依存関係を解決して、1つまたは少数のファイルにまとめる（バンドルする）ツールです。

**主な役割:**

1. **依存関係の解決**: モジュール間の`import`/`export`を解析し、依存関係を解決
2. **ファイルの統合**: 複数のモジュールファイルを1つまたは少数のファイルにまとめる
3. **最適化**: 不要なコードの削除、コードの圧縮、Tree Shakingなど
4. **トランスパイル**: TypeScript、SCSS、JSXなどをブラウザが理解できる形式に変換

### 2. モジュールバンドラーのメリット

#### 2.1. 読み込み速度の改善

**モジュールバンドラーがない場合:**

```
【ブラウザが各モジュールファイルを個別にリクエスト】
1. index.html を読み込む
2. main.js を読み込む
3. utils/helper.js を読み込む（main.jsから依存）
4. components/Button.js を読み込む（main.jsから依存）
5. components/Form.js を読み込む（main.jsから依存）
6. utils/validator.js を読み込む（Form.jsから依存）
...（多数のHTTPリクエスト）

【問題点】
- HTTPリクエスト数が多い → サーバーへの負荷が高い
- ネットワークレイテンシの影響を受けやすい
- 読み込み時間が長くなる
```

**モジュールバンドラーがある場合:**

```
【ブラウザが1つのバンドルファイルを読み込む】
1. index.html を読み込む
2. bundle.js を読み込む（すべてのモジュールが含まれている）

【メリット】
- HTTPリクエスト数が少ない → サーバーへの負荷が低い
- ネットワークレイテンシの影響を受けにくい
- 読み込み時間が短くなる
```

#### 2.2. モジュール形式の統一

モジュールバンドラーは、様々なモジュール形式をサポートし、統一された形式に変換します：

- **ES6 Modules（ESM）**: `import`/`export`構文
- **CommonJS**: `require()`/`module.exports`
- **AMD**: `define()`構文
- **UMD**: 複数のモジュール形式に対応

### 3. モジュールバンドラーがない場合のペインポイント

#### 3.1. サーバーへの負荷が高い

**問題:**

- ブラウザが各モジュールファイルを個別にHTTPリクエストする必要がある
- 100個のモジュールがある場合、100回のHTTPリクエストが発生する
- サーバーへの負荷が高くなる

**例:**

```
【モジュールバンドラーなし】
- main.js → 1リクエスト
- utils/helper.js → 1リクエスト
- components/Button.js → 1リクエスト
- components/Form.js → 1リクエスト
...（合計100リクエスト）

【モジュールバンドラーあり】
- bundle.js → 1リクエスト（すべてのモジュールが含まれている）
```

#### 3.2. コードのトランスパイルを個別に行う必要がある

**問題:**

- TypeScript、SCSS、JSXなどをブラウザが理解できる形式に変換する必要がある
- モジュールバンドラーがない場合、各ファイルを個別にトランスパイルする必要がある
- ビルドプロセスが複雑になる

**例:**

```
【モジュールバンドラーなし】
1. TypeScriptファイル（.ts）を個別にJavaScript（.js）に変換
2. SCSSファイル（.scss）を個別にCSS（.css）に変換
3. JSXファイル（.jsx）を個別にJavaScript（.js）に変換
...（各ファイルを個別に処理）

【モジュールバンドラーあり】
1. すべてのファイルを一度に処理
2. TypeScript、SCSS、JSXなどを自動的にトランスパイル
3. 1つのバンドルファイルにまとめる
```

#### 3.3. 依存関係の管理が困難

**問題:**

- モジュール間の依存関係を手動で管理する必要がある
- 依存関係の順序を考慮して、正しい順序で読み込む必要がある
- 循環依存の問題が発生しやすい

**例:**

```
【モジュールバンドラーなし】
<!-- 依存関係を手動で管理 -->
<script src="utils/helper.js"></script>
<script src="components/Button.js"></script>  <!-- helper.jsに依存 -->
<script src="components/Form.js"></script>    <!-- helper.jsとButton.jsに依存 -->
<script src="main.js"></script>               <!-- すべてに依存 -->

【問題点】
- 読み込み順序を間違えるとエラーが発生する
- 依存関係が複雑になると管理が困難

【モジュールバンドラーあり】
<!-- 依存関係を自動的に解決 -->
<script src="bundle.js"></script>  <!-- すべてのモジュールが正しい順序で含まれている -->
```

#### 3.4. 開発体験の悪化

**問題:**

- 開発時に、各モジュールファイルを個別に管理する必要がある
- ホットリロード（HMR: Hot Module Replacement）が困難
- デバッグが困難（複数のファイルに分散している）

### 4. 本プロジェクトでの実装状況

#### 4.1. Nuxt 3がViteを使用

**実装箇所: `nuxt.config.ts`**

```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  vite: {
    plugins: [tsconfigPaths()],
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
  },
  // ...
})
```

**Viteが使用されている根拠:**

1. **`nuxt.config.ts`に`vite`設定がある**
   - 27-34行目に`vite`設定ブロックが存在
   - これにより、Nuxt 3がViteを使用していることが明示される

2. **`vite-tsconfig-paths`プラグインを使用**
   - `package.json`の`devDependencies`に`vite-tsconfig-paths`が含まれている
   - `nuxt.config.ts`で`import tsconfigPaths from 'vite-tsconfig-paths'`としてインポート
   - Viteプラグインを使用していることから、Viteが使用されていることが確認できる

3. **`nuxt`パッケージの依存関係として`vite`が含まれている**
   - `npm list`コマンドで確認すると、`nuxt`パッケージの依存関係として`vite@5.4.21`が含まれている
   - Nuxt 3は内部でViteを依存関係として持っている

4. **Nuxt 3の公式ドキュメント**
   - Nuxt 3の公式ドキュメント（https://nuxt.com/）では、Nuxt 3がデフォルトでViteを使用することが明記されている

**説明:**

- Nuxt 3は、デフォルトで**Vite**をモジュールバンドラーとして使用している
- Viteは、内部で**Rollup**や**esbuild**を使用してバンドリングを行う
- `vite`設定で、Viteの動作をカスタマイズできる

#### 4.2. ES6モジュール形式を使用

**実装箇所: `package.json`**

```json
{
  "type": "module",
  "scripts": {
    "build": "nuxt build"
  }
}
```

**説明:**

- `"type": "module"`により、ES6モジュール形式（`import`/`export`）を使用
- `npm run build`で`nuxt build`を実行すると、Viteがモジュールをバンドルする

#### 4.3. ビルドプロセス

**ビルドコマンド:**

```bash
npm run build
```

**ビルド時の動作:**

1. Nuxt 3がViteを起動
2. Viteがすべてのモジュールファイルを解析
3. 依存関係を解決（`import`/`export`を解析）
4. TypeScript、SCSS、Vueファイルなどをトランスパイル
5. 1つまたは少数のバンドルファイルにまとめる
6. `.output`ディレクトリに出力

**出力されるファイル:**

- `.output/public/` - クライアントサイドのバンドルファイル
- `.output/server/` - サーバーサイドのバンドルファイル

**実際のバンドルファイルの構造（`npm run build`実行後）:**

```
.output/
├── public/                    # クライアントサイドのバンドルファイル
│   ├── _nuxt/                # Nuxtが生成するバンドルファイル
│   │   ├── entry.js          # エントリーポイント
│   │   ├── index-[hash].js   # メインのJavaScriptバンドル（ハッシュ付き）
│   │   ├── index-[hash].css  # メインのCSSバンドル（ハッシュ付き）
│   │   ├── [chunk]-[hash].js # コード分割されたチャンクファイル
│   │   └── ...
│   └── ...
└── server/                    # サーバーサイドのバンドルファイル
    ├── index.mjs             # サーバーエントリーポイント
    └── ...
```

**重要なポイント:**

- **単一の`bundle.js`ではない**: Nuxt 3/Viteは、コード分割（code splitting）により、複数のチャンクファイルに分割します
- **ハッシュ付きファイル名**: キャッシュバスティングのため、ファイル名にハッシュが含まれます（例: `index-a1b2c3d4.js`）
- **`.gitignore`に含まれている**: `.output`ディレクトリは`.gitignore`に含まれているため、Gitにはコミットされません（ビルド成果物のため）

#### 4.4. 開発時の動作

**開発コマンド:**

```bash
npm run dev
```

**開発時の動作:**

1. Nuxt 3がViteの開発サーバーを起動
2. ファイルを変更すると、Viteが自動的に再バンドル
3. ホットリロード（HMR）により、ブラウザが自動的に更新
4. 本番ビルドとは異なり、モジュールは個別に読み込まれる（開発時の高速化のため）

### 5. Viteの特徴

#### 5.1. 高速な開発サーバー

**特徴:**

- 開発時は、モジュールを個別に読み込む（ESM形式）
- 本番ビルド時のみ、バンドルを行う
- これにより、開発時の起動が高速

#### 5.2. 様々なモジュール形式をサポート

**サポートしている形式:**

- **ES6 Modules**: `import`/`export`
- **CommonJS**: `require()`/`module.exports`（自動的に変換）
- **TypeScript**: `.ts`、`.tsx`ファイル
- **Vue**: `.vue`ファイル
- **SCSS/SASS**: `.scss`、`.sass`ファイル
- **CSS Modules**: `.module.css`、`.module.scss`ファイル

#### 5.3. 自動的な依存関係の解決

**動作:**

- `import`文を解析して、依存関係を自動的に解決
- `node_modules`からパッケージを自動的に解決
- 循環依存を検出してエラーを表示

**例:**

```typescript
// pages/index.vue
import { useQuotes } from '@/composables/useQuotes' // ← Viteが自動的に解決
import { ref } from 'vue' // ← node_modulesから自動的に解決
```

### 6. 評価項目との対応

| 評価項目の内容                               | 実装状況 | 説明                                                               |
| -------------------------------------------- | -------- | ------------------------------------------------------------------ |
| **様々なモジュールのファイル形式をサポート** | ✅ 該当  | Nuxt 3/ViteはES6、CommonJS、TypeScript、Vue、SCSSなどをサポート    |
| **モジュール間の依存関係を解決**             | ✅ 該当  | Viteが`import`/`export`を解析して、自動的に依存関係を解決          |
| **一つのファイルにまとめる**                 | ✅ 該当  | `npm run build`でバンドルされたファイルを生成（`.output/public/`） |
| **読み込み速度の改善**                       | ✅ 該当  | バンドルにより、HTTPリクエスト数を削減し、読み込み速度が改善       |
| **ペインポイントの説明**                     | ✅ 該当  | 上記の「3. モジュールバンドラーがない場合のペインポイント」で説明  |

### 7. 実装ファイル一覧

| ファイル         | 役割                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `nuxt.config.ts` | Nuxt 3の設定ファイル（Viteの設定を含む）                          |
| `package.json`   | プロジェクトの設定（`"type": "module"`でES6モジュール形式を指定） |
| `.output/`       | ビルド後の出力ディレクトリ（バンドルされたファイルが含まれる）    |

### 8. まとめ

**モジュールバンドラーの役割:**

1. **依存関係の解決**: モジュール間の`import`/`export`を解析し、依存関係を解決
2. **ファイルの統合**: 複数のモジュールファイルを1つまたは少数のファイルにまとめる
3. **最適化**: 不要なコードの削除、コードの圧縮、Tree Shakingなど
4. **トランスパイル**: TypeScript、SCSS、JSXなどをブラウザが理解できる形式に変換

**本プロジェクトでの実装:**

- Nuxt 3がViteをモジュールバンドラーとして使用
- ES6モジュール形式（`import`/`export`）を使用
- `npm run build`でバンドルされたファイルを生成
- 開発時は高速な開発サーバー、本番時は最適化されたバンドルファイルを生成

**モジュールバンドラーがない場合のペインポイント:**

1. サーバーへの負荷が高い（各モジュールファイルを個別にリクエスト）
2. コードのトランスパイルを個別に行う必要がある
3. 依存関係の管理が困難（手動で読み込み順序を管理）
4. 開発体験の悪化（ホットリロードが困難、デバッグが困難）
