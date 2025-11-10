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


**自分的によく学んどいた方がいいと思うこと**
- Vue2とVue3の大きな違いは？
- そもそもTypeScriptがいいってなってるのはなんでなの？
- Vue3のライフサイクルフック
  - Vue2との違いは？