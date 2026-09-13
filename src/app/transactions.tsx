import { useRouter } from 'expo-router'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, Icon, Input, Paper, TransactionItem, Typography } from '@/components/ui'
import { auth, db } from '@/services/firebase'
import type { Transaction } from '@/shared/types/transaction'
import { colors } from '@/styles/colors'

const categoryOptions = [
  { label: 'Todas', value: '' },
  { label: 'Alimentação', value: 'Alimentação' },
  { label: 'Moradia', value: 'Moradia' },
  { label: 'Transporte', value: 'Transporte' },
  { label: 'Saúde', value: 'Saúde' },
  { label: 'Lazer', value: 'Lazer' },
  { label: 'Educação', value: 'Educação' },
  { label: 'Salário', value: 'Salário' },
  { label: 'Outros', value: 'Outros' },
]

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

export default function TransactionScreen() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchTransactions = async (isInitial = false) => {
    const user = auth?.currentUser
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
      const data: Transaction[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
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

  function removeTransaction(id: string) {
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
            console.error('Erro ao excluir transação:', error)
            Alert.alert('Erro', 'Não foi possível excluir o item.')
          }
        },
      },
    ])
  }

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Cabeçalho */}
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

        {/* Filtro de Categorias em Pílulas Horizontais */}
        <View style={styles.filterSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
            {categoryOptions.map((cat) => {
              const isSelected = selectedCategory === cat.value
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => setSelectedCategory(cat.value)}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                >
                  <Typography 
                    variant="body-sm" 
                    style={[styles.pillText, isSelected && styles.pillTextSelected]}
                  >
                    {cat.label}
                  </Typography>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>

        {/* Lista de Transações */}
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
                  date={formatDate(item.date)}
                  onDelete={() => removeTransaction(item.id)}
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

      {/* Botão Flutuante (FAB) de Pesquisa */}
      <Pressable
        style={styles.fab}
        onPress={() => setIsSearchModalOpen(true)}
        accessibilityLabel="Pesquisar transações"
      >
        <Icon name="search" size={24} color={colors.white} />
      </Pressable>

      {/* Modal de Pesquisa Rápida */}
      <Modal
        visible={isSearchModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSearchModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Typography variant="title" weight="bold" color="active">
                Pesquisar Transação
              </Typography>
              <Pressable onPress={() => setIsSearchModalOpen(false)}>
                <Icon name="close" size={24} color={colors.primary} />
              </Pressable>
            </View>

            <Input
              placeholder="Digite a descrição (ex: Mercado)..."
              value={search}
              onChangeText={setSearch}
              paddingSize="large"
              autoFocus
              style={styles.searchInput}
            />

            <Button size="large" fullWidth onPress={() => setIsSearchModalOpen(false)}>
              Filtrar
            </Button>
          </View>
        </View>
      </Modal>
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
    height: 44,
  },
  pillsContainer: {
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  pillTextSelected: {
    color: colors.white,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
  },
})