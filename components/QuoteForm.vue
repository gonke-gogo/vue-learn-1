<template>
  <div class="formCard">
    <h2>{{ isEditMode ? '編集' : '新規追加' }}</h2>
    <form @submit.prevent="handleSubmit">
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
        <label for="author">著者</label>
        <input
          id="author"
          :value="modelValue.author"
          @input="updateAuthor"
          type="text"
          class="input"
          placeholder="著者名（任意）"
        />
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
import type { Quote } from '@/types/quote'

// Props定義
interface Props {
  modelValue: {
    text: string
    author?: string
    tags?: string[]
  }
  isEditMode?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
  isLoading: false,
})

// Event定義
const emit = defineEmits<{
  'update:modelValue': [value: { text: string; author?: string; tags?: string[] }]
  submit: [value: { text: string; author?: string; tags?: string[] }]
  cancel: []
}>()

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

// 著者更新ハンドラ
function updateAuthor(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', {
    ...props.modelValue,
    author: target.value,
  })
}

// タグ入力更新ハンドラ
function updateTagsInput(event: Event) {
  const target = event.target as HTMLInputElement
  tagsInput.value = target.value
}

// サブミットハンドラ（EventEmitterでvalueのみを親に投げる）
function handleSubmit() {
  const formValue = {
    text: props.modelValue.text,
    author: props.modelValue.author || undefined,
    tags: props.modelValue.tags || [],
  }
  emit('submit', formValue)
}

// キャンセルハンドラ
function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.formCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 2rem;
  margin-bottom: 2rem;
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
