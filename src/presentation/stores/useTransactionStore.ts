import type { CreateTransactionDTO, Transaction } from '@/domain/entities/Transaction'
import { cachedTransactionRepository as transactionRepository } from '@/infrastructure/repositories/CachedTransactionRepository'
import { create } from 'zustand'

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  lastItemId?: string
  
  // Ações
  fetchTransactions: (userId: string, isInitial?: boolean) => Promise<void>
  addTransaction: (userId: string, transaction: CreateTransactionDTO) => Promise<boolean>
  removeTransaction: (id: string, userId: string) => Promise<void>
  editTransaction: (id: string, userId: string, updatedData: Partial<Transaction>) => Promise<boolean>
  reset: () => void
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  lastItemId: undefined,

  fetchTransactions: async (userId: string, isInitial = false) => {
    const { hasMore, loadingMore, lastItemId, transactions } = get()
    
    if (isInitial) {
      set({ loading: true, lastItemId: undefined, hasMore: true })
    } else {
      if (!hasMore || loadingMore) return
      set({ loadingMore: true })
    }

    try {
      const currentLastId = isInitial ? undefined : lastItemId
      // Agora chamamos a nossa interface limpa, sem saber de Firebase!
      const result = await transactionRepository.getTransactions(userId, 15, currentLastId)

      set({
        transactions: isInitial ? result.data : [...transactions, ...result.data],
        lastItemId: result.lastItemId,
        hasMore: result.hasMore,
        loading: false,
        loadingMore: false,
      })
    } catch (error) {
      console.error('Erro ao buscar transações na Store:', error)
      set({ loading: false, loadingMore: false })
    }
  },

  addTransaction: async (userId: string, transactionData: CreateTransactionDTO) => {
    try {
      await transactionRepository.createTransaction(userId, transactionData)
      await get().fetchTransactions(userId, true) // Recarrega do zero para garantir a ordem
      return true
    } catch (error) {
      console.error('Erro ao adicionar na Store:', error)
      return false
    }
  },

  editTransaction: async (id: string, userId: string, updatedData: Partial<Transaction>) => {
    try {
      await transactionRepository.updateTransaction(id, updatedData)
      await get().fetchTransactions(userId, true)
      return true
    } catch (error) {
      console.error('Erro ao editar na Store:', error)
      return false
    }
  },

  removeTransaction: async (id: string, userId: string) => {
     try {
        await transactionRepository.deleteTransaction(id)
        await get().fetchTransactions(userId, true)
     } catch (error) {
        console.error('Erro ao excluir na Store:', error)
        throw error
     }
  },

  reset: () => set({ transactions: [], loading: false, loadingMore: false, hasMore: true, lastItemId: undefined })
}))