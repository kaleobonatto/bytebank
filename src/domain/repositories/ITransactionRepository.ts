import type { CreateTransactionDTO, Transaction } from '../entities/Transaction'

export interface PaginatedResult<T> {
  data: T[]
  lastItemId?: string // Usado para buscar a próxima página
  hasMore: boolean
}

export interface ITransactionRepository {
  getTransactions(userId: string, pageSize: number, lastItemId?: string): Promise<PaginatedResult<Transaction>>
  createTransaction(userId: string, data: CreateTransactionDTO): Promise<Transaction>
  updateTransaction(id: string, data: Partial<Transaction>): Promise<void>
  deleteTransaction(id: string): Promise<void>
}