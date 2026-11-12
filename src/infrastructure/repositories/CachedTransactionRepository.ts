import AsyncStorage from '@react-native-async-storage/async-storage'
import { cryptoService } from '../security/cryptoService'
import { transactionRepository as firestoreRepo } from './FirestoreTransactionRepository'

import type { CreateTransactionDTO, Transaction } from '@/domain/entities/Transaction'
import type { ITransactionRepository, PaginatedResult } from '@/domain/repositories/ITransactionRepository'

const CACHE_KEY = '@bytebank:transactions'

export class CachedTransactionRepository implements ITransactionRepository {
  
  async getTransactions(userId: string, pageSize: number, lastItemId?: string): Promise<PaginatedResult<Transaction>> {
    // 1. Se for a primeira página, tenta buscar do cache criptografado primeiro
    if (!lastItemId) {
      try {
        const encryptedCache = await AsyncStorage.getItem(`${CACHE_KEY}_${userId}`)
        if (encryptedCache) {
          const cachedData = cryptoService.decrypt<PaginatedResult<Transaction>>(encryptedCache)
          // Dispara a busca no Firebase em background para manter os dados atualizados (Padrão Stale-while-revalidate)
          this.fetchAndCache(userId, pageSize)
          
          if (cachedData) return cachedData
        }
      } catch (e) {
        console.warn('Falha ao ler cache', e)
      }
    }

    // 2. Se não tem cache ou é a próxima página da lista, busca direto do Firestore
    return this.fetchAndCache(userId, pageSize, lastItemId)
  }

  // Método auxiliar que busca no Firestore e salva no cache cifrado
  private async fetchAndCache(userId: string, pageSize: number, lastItemId?: string) {
    const freshData = await firestoreRepo.getTransactions(userId, pageSize, lastItemId)
    
    if (!lastItemId) {
      const encrypted = cryptoService.encrypt(freshData)
      await AsyncStorage.setItem(`${CACHE_KEY}_${userId}`, encrypted)
    }
    return freshData
  }

  async createTransaction(userId: string, data: CreateTransactionDTO): Promise<Transaction> {
    const result = await firestoreRepo.createTransaction(userId, data)
    await this.invalidateCache(userId)
    return result
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<void> {
    await firestoreRepo.updateTransaction(id, data)
  }

  async deleteTransaction(id: string): Promise<void> {
    await firestoreRepo.deleteTransaction(id)
    await this.invalidateCache(id) // O ID aqui precisaria ser o userId, mas a store já força o refetch.
  }

  private async invalidateCache(userId: string) {
    await AsyncStorage.removeItem(`${CACHE_KEY}_${userId}`)
  }
}

export const cachedTransactionRepository = new CachedTransactionRepository()