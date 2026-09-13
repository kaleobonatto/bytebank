import { db } from '@/services/firebase'
import type { Transaction } from '@/types/transaction'
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    startAfter,
    updateDoc,
    where,
} from 'firebase/firestore'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuth } from './AuthContext'

type TransactionContextType = {
  transactions: Transaction[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  fetchTransactions: (isInitial?: boolean) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>
  removeTransaction: (id: string) => Promise<void>
  editTransaction: (id: string, updatedData: Partial<Transaction>) => Promise<boolean>
}

const TransactionContext = createContext<TransactionContextType>({} as TransactionContextType)

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchTransactions = async (isInitial = false) => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    if (isInitial) {
      setLoading(true)
      setLastDoc(null)
    } else {
      if (!hasMore || loadingMore) return
      setLoadingMore(true)
    }

    try {
      let q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(15)
      )

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Transaction[]

      const lastVisible = snapshot.docs[snapshot.docs.length - 1]

      setTransactions((prev) => (isInitial ? data : [...prev, ...data]))
      setLastDoc(lastVisible || null)
      setHasMore(snapshot.docs.length === 15)
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchTransactions(true)
  }, [user])

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return false
    try {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: user.uid,
      })
      await fetchTransactions(true)
      return true
    } catch (error) {
      console.error('Erro ao adicionar:', error)
      return false
    }
  }

  const editTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    try {
      await updateDoc(doc(db, 'transactions', id), updatedData)
      await fetchTransactions(true)
      return true
    } catch (error) {
      console.error('Erro ao editar:', error)
      return false
    }
  }

  const removeTransaction = async (id: string) => {
    Alert.alert('Excluir transação', 'Deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'transactions', id))
            await fetchTransactions(true)
          } catch (error) {
            console.error('Erro ao excluir:', error)
            Alert.alert('Erro', 'Não foi possível excluir o item.')
          }
        },
      },
    ])
  }

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        loadingMore,
        hasMore,
        fetchTransactions,
        addTransaction,
        removeTransaction,
        editTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  )
}

export const useTransactions = () => useContext(TransactionContext)