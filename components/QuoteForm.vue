<template>
  <!-- Tailwind CSSのユーティリティクラスと既存のSCSSスタイルを組み合わせ -->
  <!-- 参考: Tailwind CSS公式ドキュメント (https://tailwindcss.com/docs) のユーティリティクラスを組み合わせて実装 -->
  <!-- 使用しているユーティリティクラス: rounded-md, shadow-sm, focus:ring-2, flex, gap, padding, transition-colors など -->
  <div class="formCard shadow-sm" :[formModeAttr]="isEditMode ? 'edit' : 'create'">
    <h2 class="formTitle text-xl md:text-2xl font-semibold">
      {{ isEditMode ? '編集' : '新規追加' }}
    </h2>
    <form :[formActionAttr]="isEditMode ? 'update' : 'create'" @submit.prevent="handleSubmit">
      <!-- Tailwindのレイアウトクラスを使用 -->
      <div class="formGroup mb-6">
        <label for="text" class="formLabel block text-sm font-medium mb-2">名言 *</label>
        <textarea
          id="text"
          :value="modelValue.text"
          required
          rows="3"
          class="input block w-full rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
          placeholder="名言を入力してください"
          @input="updateText"
        />
      </div>
      <div class="formGroup mb-6">
        <label for="authorId" class="formLabel block text-sm font-medium mb-2">著者</label>
        <select
          id="authorId"
          :value="modelValue.authorId || ''"
          class="input block w-full rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
          @change="updateAuthorId"
        >
          <option value="">著者を選択（任意）</option>
          <option v-for="author in authors" :key="author.id" :value="author.id">
            {{ author.name }}
          </option>
        </select>
      </div>
      <div class="formGroup mb-6">
        <label for="tags" class="formLabel block text-sm font-medium mb-2"
          >タグ（カンマ区切り）</label
        >
        <input
          id="tags"
          :value="tagsInput"
          type="text"
          class="input block w-full rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
          placeholder="例: 成功, 挑戦, 努力"
          @input="updateTagsInput"
        />
      </div>
      <!-- TailwindのFlexboxクラスを使用 -->
      <div class="formActions flex flex-col md:flex-row gap-3 md:gap-4">
        <button
          type="submit"
          class="button bg-pink-500 inline-flex justify-center items-center px-8 py-3.5 border-transparent text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          :disabled="isLoading"
        >
          {{ isEditMode ? '更新' : '追加' }}
        </button>
        <button
          type="button"
          class="button buttonSecondary inline-flex justify-center items-center px-8 py-3.5 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
          @click="handleCancel"
        >
          キャンセル
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { getActivePinia } from 'pinia'
import type { ComputedRef } from 'vue'
import { nextTick, watch } from 'vue'
import { useAuthors } from '@/composables/useAuthors'
import type { Author } from '@/types/author'

// Props定義
interface Props {
  modelValue: {
    text: string
    authorId?: string
    tags?: string[]
  }
  isEditMode?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  isLoading: false,
})

// authorsとloadAuthorsをrefとして定義（onMounted内で初期化）
const authorsComposable = ref<ReturnType<typeof useAuthors> | null>(null)
const authors = ref<Author[]>([])

// Event定義
const emit = defineEmits<{
  'update:modelValue': [value: { text: string; authorId?: string; tags?: string[] }]
  submit: [value: { text: string; authorId?: string; tags?: string[] }]
  cancel: []
}>()

// 動的引数の例
// 編集モード/新規モードに応じて動的に属性名を変更
const formModeAttr = ref('data-form-mode')
const formActionAttr = ref('data-form-action')

// タグ入力用のローカル状態（カンマ区切りの文字列）
const tagsInput = computed({
  get: () => (props.modelValue.tags || []).join(', '),
  set: (value: string) => {
    const tags = parseTags(value)
    emit('update:modelValue', {
      ...props.modelValue,
      tags,
    })
  },
})

// タグをパースする関数
function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

// テキスト更新ハンドラ
function updateText(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', {
    ...props.modelValue,
    text: target.value,
  })
}

// 著者ID更新ハンドラ
function updateAuthorId(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', {
    ...props.modelValue,
    authorId: target.value || undefined,
  })
}

// タグ入力更新ハンドラ
function updateTagsInput(event: Event) {
  const target = event.target as HTMLInputElement
  tagsInput.value = target.value
}

// サブミットハンドラ（EventEmitterでvalueのみを親に投げる）
function handleSubmit() {
  console.log('[QuoteForm] handleSubmit called')
  // バリデーション：テキストが空の場合は送信しない
  const text = props.modelValue.text || ''
  const trimmedText = text.trim()
  if (!trimmedText) {
    alert('名言を入力してください')
    return
  }

  const formValue = {
    text: trimmedText, // 前後の空白を削除
    authorId:
      props.modelValue.authorId && props.modelValue.authorId.trim() !== ''
        ? props.modelValue.authorId
        : undefined,
    tags: props.modelValue.tags || [],
  }
  console.log('[QuoteForm] Emitting submit event with:', formValue)
  emit('submit', formValue)
}

// キャンセルハンドラ
function handleCancel() {
  emit('cancel')
}

// watchでpropsの変更を検知し、oldValueとnewValueを比較する処理
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // 編集モードがtrueの場合のみ処理
    if (!props.isEditMode) return

    // oldValueとnewValueを比較して、変更があった場合のみ処理
    if (oldValue && newValue) {
      // テキストが変更された場合
      if (oldValue.text !== newValue.text) {
        // テキスト変更時の処理（必要に応じて追加）
      }

      // 著者IDが変更された場合
      if (oldValue.authorId !== newValue.authorId) {
        // 著者IDが変更された場合、著者一覧を再読み込み（必要に応じて）
        if (newValue.authorId && !oldValue.authorId && authorsComposable.value) {
          authorsComposable.value.loadAuthors()
        }
      }

      // タグが変更された場合
      const oldTags = (oldValue.tags || []).join(',')
      const newTags = (newValue.tags || []).join(',')
      if (oldTags !== newTags) {
        // タグ変更時の処理（必要に応じて追加）
      }
    }
  },
  { deep: true } // オブジェクトの深い監視
)

// data-form-mode属性とdata-form-action属性を使った例：コンポーネントマウント時に属性を読み取る
onMounted(async () => {
  // Piniaが初期化されるまで待つ
  await nextTick()

  let pinia = getActivePinia()
  if (!pinia) {
    // Piniaが初期化されるまで少し待つ（最大20回、50ms間隔）
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      pinia = getActivePinia()
      if (pinia) break
    }
  }

  if (pinia) {
    try {
      // Piniaが初期化された後にuseAuthors()を呼び出す
      authorsComposable.value = useAuthors()

      // authorsをwatchで更新
      if (authorsComposable.value) {
        watch(
          () => {
            if (!authorsComposable.value) return []
            const authorsRef = authorsComposable.value.authors as unknown as ComputedRef<
              readonly Author[]
            >
            return authorsRef.value || []
          },
          (newAuthors) => {
            console.log('[QuoteForm] authors watch triggered, newAuthors:', newAuthors?.length)
            if (newAuthors && Array.isArray(newAuthors)) {
              authors.value = [...newAuthors] as Author[]
              console.log('[QuoteForm] authors.value updated:', authors.value.length)
            }
          },
          { immediate: true }
        )

        // 著者一覧を読み込む
        console.log('[QuoteForm] Loading authors...')
        await authorsComposable.value.loadAuthors()
        console.log('[QuoteForm] loadAuthors completed')

        // loadAuthors後、少し待ってからauthorsを確認して更新
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 100)) // データが反映されるまで少し待つ

        if (authorsComposable.value) {
          const authorsRef = authorsComposable.value.authors as unknown as ComputedRef<
            readonly Author[]
          >
          const currentAuthors = authorsRef.value || []
          console.log('[QuoteForm] currentAuthors after loadAuthors:', currentAuthors.length)
          if (currentAuthors.length > 0) {
            authors.value = [...currentAuthors] as Author[]
            console.log('[QuoteForm] authors.value set after loadAuthors:', authors.value.length)
          } else {
            // まだ空の場合は、もう少し待ってから再確認
            await new Promise((resolve) => setTimeout(resolve, 200))
            const retryAuthors = authorsRef.value || []
            if (retryAuthors.length > 0) {
              authors.value = [...retryAuthors] as Author[]
              console.log('[QuoteForm] authors.value set after retry:', authors.value.length)
            }
          }
        }
      }
    } catch (err) {
      console.error('[QuoteForm] Error initializing authors composable:', err)
    }
  } else {
    console.warn('[QuoteForm] Pinia is not initialized, fetching authors directly from API')
    // Piniaが初期化されていない場合、APIから直接取得
    try {
      const { data: fetchedAuthors } = await useFetch<Author[]>('/api/authors')
      if (fetchedAuthors.value && fetchedAuthors.value.length > 0) {
        authors.value = fetchedAuthors.value
        console.log('[QuoteForm] authors.value set from API:', authors.value.length)
      }
    } catch (err) {
      console.error('[QuoteForm] Error fetching authors from API:', err)
    }
  }

  // DOM要素を取得してdata-form-mode属性を読み取る
  const formCardElement = document.querySelector('.formCard') as HTMLElement
  if (formCardElement) {
    const _formMode = formCardElement.getAttribute('data-form-mode')
    // 属性に基づいて処理を分岐することも可能
    // if (_formMode === 'edit') {
    //   // 編集モード特有の処理
    // } else if (_formMode === 'create') {
    //   // 新規作成モード特有の処理
    // }
  }

  // data-form-action属性を読み取る例
  const formElement = document.querySelector('form') as HTMLFormElement
  if (formElement) {
    const _formAction = formElement.getAttribute('data-form-action')
    // 属性に基づいて処理を分岐することも可能
    // if (_formAction === 'update') {
    //   // 更新処理特有の設定
    // } else if (_formAction === 'create') {
    //   // 作成処理特有の設定
    // }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.formCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

/* タブレット以上 */
@media (min-width: $breakpoint-tablet) {
  .formCard {
    padding: 2rem;
  }
}

/* data-form-mode属性を使った条件付きスタイリングの例 */
/* 編集モードの場合は左側にボーダーを追加 */
.formCard[data-form-mode='edit'] {
  border-left: 4px solid #f59e0b; /* オレンジ色のボーダー */
}

/* 新規作成モードの場合は左側に別の色のボーダーを追加 */
.formCard[data-form-mode='create'] {
  border-left: 4px solid #10b981; /* 緑色のボーダー */
}

/* data-form-action属性を使った条件付きスタイリングの例 */
/* 更新アクションの場合、フォームに影を追加 */
form[data-form-action='update'] {
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2); /* オレンジ系の影 */
}

/* 作成アクションの場合、フォームに別の影を追加 */
form[data-form-action='create'] {
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2); /* 緑系の影 */
}

.formTitle {
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.formGroup {
  margin-bottom: 1.5rem;
}

.formLabel {
  color: var(--color-text);
}

.input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
  font-family: inherit;

  &:focus {
    border-color: var(--color-primary);
    // TailwindのringカラーをCSS変数で設定
    --tw-ring-color: var(--color-primary);
  }
}

.button {
  /* background-colorはTailwindクラス（bg-pink-500）で指定 */
  color: white;
  cursor: pointer;
  border: none;
  width: 100%;
  padding: 0.7rem 1.5rem;

  /* タブレット以上 */
  @media (min-width: $breakpoint-tablet) {
    width: auto;
  }

  &:hover {
    background-color: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    --tw-ring-color: var(--color-primary);
  }
}

.buttonSecondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonSecondary:hover {
  background-color: var(--color-border);
}
</style>
