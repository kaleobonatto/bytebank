import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import EditTransactionModal from '@/components/EditTransactionModal/EditTransactionModal'
import { Button, Icon, Input, Paper, TransactionItem, Typography } from '@/components/ui'
import { useTransactions } from '@/contexts/TransactionContext'
import { auth } from '@/services/firebase'
import { uploadReceiptImage } from '@/services/uploadStorage'
import { colors } from '@/styles/colors'
import type { Transaction } from '@/types/transaction'

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
  
  const { transactions, loading, loadingMore, fetchTransactions, removeTransaction, editTransaction } = useTransactions()
  
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

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
                  receiptUrl={(item as any).receiptUrl}
                  onDelete={() => removeTransaction(item.id)}
                  onEdit={() => setEditingTransaction(item)}
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

      {/* Modal de Edição */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          initial={{
            id: editingTransaction.id,
            type: editingTransaction.type,
            name: editingTransaction.name,
            amount: editingTransaction.amount,
            date: editingTransaction.date,
            category: editingTransaction.category,
            receiptUrl: (editingTransaction as any).receiptUrl,
          }}
          onSubmit={async (payload) => {
            if (payload.id) {
              const user = auth?.currentUser
              let finalReceiptUrl = payload.receiptUrl

              if (payload.receiptUrl && payload.receiptUrl.startsWith('file://') && user) {
                const uploaded = await uploadReceiptImage(payload.receiptUrl, user.uid)
                if (uploaded) finalReceiptUrl = uploaded
              }

              const finalAmount = 
                payload.type === 'Depósito' || payload.type === 'Pix' 
                  ? Math.abs(payload.amount) 
                  : -Math.abs(payload.amount)

              const success = await editTransaction(payload.id, {
                type: payload.type,
                name: payload.name,
                amount: finalAmount,
                date: payload.date,
                category: payload.category as any,
                receiptUrl: finalReceiptUrl,
              } as any)

              if (success) setEditingTransaction(null)
            }
          }}
        />
      )}
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