import { db } from '@/services/firebase'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where,
} from 'firebase/firestore'

import type { CreateTransactionDTO, Transaction } from '@/domain/entities/Transaction'
import type { ITransactionRepository, PaginatedResult } from '@/domain/repositories/ITransactionRepository'

export class FirestoreTransactionRepository implements ITransactionRepository {
  private readonly collectionName = 'transactions'

  async getTransactions(
    userId: string,
    pageSize: number,
    lastItemId?: string
  ): Promise<PaginatedResult<Transaction>> {
    const transactionsRef = collection(db, this.collectionName)

    // Monta a query base
    let q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(pageSize)
    )

    // Se tivermos um lastItemId (cursor de paginação), buscamos o documento para usar no startAfter
    if (lastItemId) {
      const lastDocRef = doc(db, this.collectionName, lastItemId)
      const lastDocSnap = await getDoc(lastDocRef)
      if (lastDocSnap.exists()) {
        q = query(q, startAfter(lastDocSnap))
      }
    }

    const snapshot = await getDocs(q)
    const data = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Transaction[]

    const lastVisible = snapshot.docs[snapshot.docs.length - 1]

    return {
      data,
      lastItemId: lastVisible?.id,
      hasMore: snapshot.docs.length === pageSize,
    }
  }

  async createTransaction(userId: string, data: CreateTransactionDTO): Promise<Transaction> {
    const transactionsRef = collection(db, this.collectionName)
    
    const docRef = await addDoc(transactionsRef, {
      ...data,
      userId,
    })

    return {
      id: docRef.id,
      userId,
      ...data,
    }
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<void> {
    const docRef = doc(db, this.collectionName, id)
    // Remove undefined values para não quebrar o Firebase
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined))
    
    await updateDoc(docRef, cleanData)
  }

  async deleteTransaction(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id)
    await deleteDoc(docRef)
  }
}

// Exportamos uma instância única (Singleton) para ser usada pela aplicação
export const transactionRepository = new FirestoreTransactionRepository()