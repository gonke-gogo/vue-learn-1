import { describe, it, expect, beforeEach } from 'vitest'
import { LocalQuoteRepository } from '../LocalQuoteRepository'
import { RepositoryError } from '../QuoteRepository'

describe('LocalQuoteRepository', () => {
  let repository: LocalQuoteRepository

  beforeEach(() => {
    repository = new LocalQuoteRepository()
    localStorage.clear()
  })

  describe('list', () => {
    it('空の配列を返す（初期状態）', async () => {
      const quotes = await repository.list()
      expect(quotes).toEqual([])
    })
  })

  describe('add', () => {
    it('名言を追加できる', async () => {
      const quote = await repository.add({
        text: 'テスト名言',
        author: 'テスト著者',
      })
      expect(quote.id).toBeDefined()
      expect(quote.text).toBe('テスト名言')
      expect(quote.author).toBe('テスト著者')
      expect(quote.createdAt).toBeDefined()
      expect(quote.updatedAt).toBeDefined()
    })

    it('id, createdAt, updatedAtが自動付与される', async () => {
      const quote = await repository.add({
        text: 'テスト名言',
      })
      expect(quote.id).toBeTruthy()
      expect(quote.createdAt).toBeTruthy()
      expect(quote.updatedAt).toBeTruthy()
      expect(new Date(quote.createdAt).getTime()).toBeGreaterThan(0)
    })
  })

  describe('get', () => {
    it('存在する名言を取得できる', async () => {
      const added = await repository.add({
        text: 'テスト名言',
      })
      const quote = await repository.get(added.id)
      expect(quote).toEqual(added)
    })

    it('存在しないIDでnullを返す', async () => {
      const quote = await repository.get('non-existent-id')
      expect(quote).toBeNull()
    })
  })

  describe('update', () => {
    it('名言を更新できる', async () => {
      const added = await repository.add({
        text: '元の名言',
        author: '元の著者',
      })
      const updated = await repository.update(added.id, {
        text: '更新された名言',
      })
      expect(updated.text).toBe('更新された名言')
      expect(updated.author).toBe('元の著者')
      expect(updated.updatedAt).not.toBe(added.updatedAt)
    })

    it('存在しないIDでエラーを投げる', async () => {
      await expect(
        repository.update('non-existent-id', { text: '更新' })
      ).rejects.toThrow(RepositoryError)
    })
  })

  describe('remove', () => {
    it('名言を削除できる', async () => {
      const added = await repository.add({
        text: '削除される名言',
      })
      await repository.remove(added.id)
      const quote = await repository.get(added.id)
      expect(quote).toBeNull()
    })

    it('存在しないIDでエラーを投げる', async () => {
      await expect(repository.remove('non-existent-id')).rejects.toThrow(RepositoryError)
    })
  })

  describe('CRUD一連の流れ', () => {
    it('追加→一覧→編集→削除が正常に動作する', async () => {
      // 追加
      const quote1 = await repository.add({
        text: '名言1',
        author: '著者1',
      })
      const quote2 = await repository.add({
        text: '名言2',
        author: '著者2',
      })

      // 一覧
      const quotes = await repository.list()
      expect(quotes).toHaveLength(2)

      // 編集
      const updated = await repository.update(quote1.id, {
        text: '更新された名言1',
      })
      expect(updated.text).toBe('更新された名言1')

      // 削除
      await repository.remove(quote2.id)
      const remaining = await repository.list()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(quote1.id)
    })
  })
})

