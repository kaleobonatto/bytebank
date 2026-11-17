import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Importações do RxJS para Programação Reativa
import { BehaviorSubject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'

import EditTransactionModal from '@/components/EditTransactionModal/EditTransactionModal'
import { Button, Icon, Input, Paper, TransactionItem, Typography } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import type { Transaction } from '@/domain/entities/Transaction'
import { useTransactionStore } from '@/presentation/stores/useTransactionStore'
import { uploadReceiptImage } from '@/services/uploadStorage'
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
  const { user } = useAuth()
  
  const { transactions, loading, loadingMore, fetchTransactions, removeTransaction, editTransaction } = useTransactionStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Criamos o nosso "Subject" reativo
  const searchSubject = useRef(new BehaviorSubject('')).current

  useEffect(() => {
    // Configura o Pipeline Reativo
    const subscription = searchSubject.pipe(
      debounceTime(300), // Aguarda 300ms de "silêncio" na digitação
      distinctUntilChanged() // Só emite se o termo for realmente diferente
    ).subscribe((value) => {
      setDebouncedSearch(value)
    })

    return () => subscription.unsubscribe()
  }, [searchSubject])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text) // Atualiza o input imediatamente (UI)
    searchSubject.next(text) // Envia para a fila do RxJS
  }

  // Filtragem local baseada na string "debounced"
  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  const handleDelete = (id: string) => {
    if (!user) return
    Alert.alert('Excluir transação', 'Deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => removeTransaction(id, user.uid)
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.push('/home')} 
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Icon name="arrow-back" size={28} color={colors.primary} />
          </Pressable>
          <Typography variant="title-lg" weight="bold" color="active">
            Minhas Transações
          </Typography>
        </View>

        {/* Filtro de Categorias */}
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
                  receiptUrl={item.receiptUrl ?? undefined}
                  onDelete={() => handleDelete(item.id)}
                  onEdit={() => setEditingTransaction(item)}
                />
              )}
              onEndReached={() => {
                 if (user) fetchTransactions(user.uid, false)
              }}
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
              placeholder="Digite a descrição..."
              value={searchQuery}
              onChangeText={handleSearchChange}
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

      {/* Modal de Edição */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          initial={{
            id: editingTransaction.id,
            type: editingTransaction.type as any,
            name: editingTransaction.name,
            amount: editingTransaction.amount,
            date: editingTransaction.date,
            category: editingTransaction.category,
            receiptUrl: editingTransaction.receiptUrl ?? undefined,
          }}
          onSubmit={async (payload) => {
            if (payload.id && user) {
              let finalReceiptUrl = payload.receiptUrl

              if (payload.receiptUrl && payload.receiptUrl.startsWith('file://')) {
                const uploaded = await uploadReceiptImage(payload.receiptUrl, user.uid)
                if (uploaded) finalReceiptUrl = uploaded
              }

              const finalAmount = 
                payload.type === 'Depósito' || payload.type === 'Pix' 
                  ? Math.abs(payload.amount) 
                  : -Math.abs(payload.amount)

              const success = await editTransaction(payload.id, user.uid, {
                type: payload.type as any,
                name: payload.name,
                amount: finalAmount,
                date: payload.date,
                category: payload.category as any,
                receiptUrl: finalReceiptUrl,
              })

              if (success) setEditingTransaction(null)
            }
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tertiary },
  mainContent: { flex: 1, padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4, borderRadius: 8 },
  backButtonPressed: { backgroundColor: 'rgba(0, 77, 97, 0.1)' },
  filterSection: { height: 44 },
  pillsContainer: { gap: 8, alignItems: 'center', paddingHorizontal: 2 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
  pillSelected: { backgroundColor: colors.primary },
  pillText: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  pillTextSelected: { color: colors.white },
  listCard: { flex: 1, padding: 8 },
  loader: { marginTop: 32 },
  footerLoader: { marginVertical: 16 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  searchModalContent: { width: '100%', maxWidth: 400, backgroundColor: colors.white, borderRadius: 12, padding: 20, gap: 16 },
  searchModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchInput: { backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 1.5, borderRadius: 8 },
})