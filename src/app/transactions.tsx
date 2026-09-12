import { useRouter } from 'expo-router'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Icon, Input, Paper, Select, TransactionItem, Typography } from '@/components/ui'
import { auth, db } from '@/services/firebase'
import type { Transaction } from '@/shared/types/transaction'
import { colors } from '@/styles/colors'

const categoryOptions = [
  { label: 'Todas as categorias', value: '' },
  { label: 'Alimentação', value: 'Alimentação' },
  { label: 'Moradia', value: 'Moradia' },
  { label: 'Transporte', value: 'Transporte' },
  { label: 'Saúde', value: 'Saúde' },
  { label: 'Lazer', value: 'Lazer' },
  { label: 'Educação', value: 'Educação' },
  { label: 'Salário', value: 'Salário' },
  { label: 'Outros', value: 'Outros' },
]

export default function TransactionScreen() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Consulta paginada ao Cloud Firestore filtrando pelo usuário logado[cite: 1]
  const fetchTransactions = async (isInitial = false) => {
    const user = auth?.currentUser || { uid: 'teste123' }
    if (!user) {
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
        limit(10)
      )

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const data: Transaction[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[]

      const lastVisible = snapshot.docs[snapshot.docs.length - 1]

      if (isInitial) {
        setTransactions(data)
      } else {
        setTransactions((prev) => [...prev, ...data])
      }

      setLastDoc(lastVisible || null)
      setHasMore(snapshot.docs.length === 10)
    } catch (error) {
      console.error('Erro ao buscar transações no Firestore:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchTransactions(true)
  }, [selectedCategory])

  // Filtro local em memória por busca textual
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        
        {/* Cabeçalho com botão de voltar */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.push('/home')} 
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
          >
            <Icon name="arrow-back" size={28} color={colors.primary} />
          </Pressable>
          <Typography variant="title-lg" weight="bold" color="active">
            Minhas Transações
          </Typography>
        </View>

        {/* Filtros */}
        <View style={styles.filterSection}>
          <Input
            placeholder="Pesquisar por descrição..."
            value={search}
            onChangeText={setSearch}
            paddingSize="large"
            style={styles.inputBackground}
          />
          <Select
            placeholder="Filtrar por Categoria"
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={styles.inputBackground}
          />
        </View>

        {/* Lista com Scroll Infinito */}
        <Paper style={styles.listCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TransactionItem
                  type={item.type}
                  name={item.name}
                  amount={item.amount}
                  date={item.date}
                  menuPlacement="inline-right"
                />
              )}
              onEndReached={() => fetchTransactions(false)}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.footerLoader} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Typography color="placeholder">Nenhuma transação encontrada.</Typography>
                </View>
              }
            />
          )}
        </Paper>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tertiary,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    borderRadius: 8,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(0, 77, 97, 0.1)',
  },
  filterSection: {
    gap: 12,
    zIndex: 50,
    elevation: 50,
  },
  inputBackground: {
    backgroundColor: colors.white,
  },
  listCard: {
    flex: 1,
    padding: 8,
  },
  loader: {
    marginTop: 32,
  },
  footerLoader: {
    marginVertical: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
})