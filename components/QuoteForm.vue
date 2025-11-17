<template>
  <div class="formCard" :[formModeAttr]="isEditMode ? 'edit' : 'create'">
    <h2>{{ isEditMode ? '編集' : '新規追加' }}</h2>
    <form @submit.prevent="handleSubmit" :[formActionAttr]="isEditMode ? 'update' : 'create'">
      <div class="formGroup">
        <label for="text">名言 *</label>
        <textarea
          id="text"
          :value="modelValue.text"
          @input="updateText"
          required
          rows="3"
          class="input"
          placeholder="名言を入力してください"
        />
      </div>
      <div class="formGroup">
        <label for="authorId">著者</label>
        <select
          id="authorId"
          :value="modelValue.authorId || ''"
          @change="updateAuthorId"
          class="input"
        >
          <option value="">著者を選択（任意）</option>
          <option v-for="author in authors" :key="author.id" :value="author.id">
            {{ author.name }}
          </option>
        </select>
      </div>
      <div class="formGroup">
        <label for="tags">タグ（カンマ区切り）</label>
        <input
          id="tags"
          :value="tagsInput"
          @input="updateTagsInput"
          type="text"
          class="input"
          placeholder="例: 成功, 挑戦, 努力"
        />
      </div>
      <div class="formActions">
        <button type="submit" class="button" :disabled="isLoading">
          {{ isEditMode ? '更新' : '追加' }}
        </button>
        <button type="button" @click="handleCancel" class="button buttonSecondary">
          キャンセル
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { Quote } from '@/types/quote'
import { useAuthors } from '@/composables/useAuthors'

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

const { authors, loadAuthors } = useAuthors()

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  isLoading: false,
})

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
  // バリデーション：テキストが空の場合は送信しない
  const text = props.modelValue.text || ''
  const trimmedText = text.trim()
  if (!trimmedText) {
    alert('名言を入力してください')
    return
  }

  const formValue = {
    text: trimmedText, // 前後の空白を削除
    authorId: props.modelValue.authorId || undefined,
    tags: props.modelValue.tags || [],
  }
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
        // 著者IDが変更された場合、著者一覧を再読み込み（必要に応じて）
        if (newValue.authorId && !oldValue.authorId) {
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

// data-form-mode属性とdata-form-action属性を使った例：コンポーネントマウント時に属性を読み取る
onMounted(async () => {
  await loadAuthors()
  // DOM要素を取得してdata-form-mode属性を読み取る
  const formCardElement = document.querySelector('.formCard') as HTMLElement
  if (formCardElement) {
    const formMode = formCardElement.getAttribute('data-form-mode')
    console.log(`フォームモード: ${formMode}`) // デバッグ用

    // 属性に基づいて処理を分岐することも可能
    // if (formMode === 'edit') {
    //   // 編集モード特有の処理
    // } else if (formMode === 'create') {
    //   // 新規作成モード特有の処理
    // }
  }

  // data-form-action属性を読み取る例
  const formElement = document.querySelector('form') as HTMLFormElement
  if (formElement) {
    const formAction = formElement.getAttribute('data-form-action')
    console.log(`フォームアクション: ${formAction}`) // デバッグ用: 'update' または 'create'

    // 属性に基づいて処理を分岐することも可能
    // if (formAction === 'update') {
    //   // 更新処理特有の設定
    // } else if (formAction === 'create') {
    //   // 作成処理特有の設定
    // }
  }
})
</script>

<style scoped>
.formCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
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

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.formGroup {
  margin-bottom: 1.5rem;
}

.formGroup label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.formActions {
  display: flex;
  gap: 1rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  cursor: pointer;
  border: none;
}

.button:hover {
  background-color: var(--color-primary-hover);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
