import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Avatar from '@/components/Avatar/Avatar'
import NewTransactionModal from '@/components/NewTransactionModal/NewTransactionModal'
import { Button, Chart, Paper, PopupMenu, TransactionItem, Typography } from '@/components/ui'
import { auth } from '@/services/firebase'
import { colors } from '@/styles/colors'
import type { TransactionType } from '@/types/transaction'

import { useTransactions } from '@/contexts/TransactionContext'
import { uploadReceiptImage } from '@/services/uploadStorage'
import { calculateHomeMetrics } from '@/utils/financialCalculations'

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Home() {
  const router = useRouter()
  const { transactions, addTransaction } = useTransactions()

  const [balanceVisible, setBalanceVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [type, setType] = useState<TransactionType | ''>('')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingCreate, setLoadingCreate] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  const { balance, balanceEvolutionData, typeData, last3MonthsData } = calculateHomeMetrics(transactions)

  const handleAmountChange = (text: string) => {
    const cleanNumeric = text.replace(/\D/g, '')
    if (!cleanNumeric) {
      setAmount('')
      return
    }
    const numberValue = Number(cleanNumeric) / 100
    setAmount(numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0].uri) {
      setReceiptUri(result.assets[0].uri)
    }
  }

  async function createTransaction() {
    const newErrors: Record<string, string> = {}
    if (!type) newErrors.type = 'O tipo de transação é obrigatório.'
    if (!category) newErrors.category = 'A categoria é obrigatória.'
    if (!name.trim()) newErrors.name = 'A descrição não pode estar vazia.'

    const rawNumberString = amount.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const numericAmount = Number(rawNumberString)

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'O valor deve ser maior que zero.'
    }
    if (!date) newErrors.date = 'A data da transação é obrigatória.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const user = auth?.currentUser
    if (!user) return

    try {
      setLoadingCreate(true)
      let receiptUrl = receiptUri ? await uploadReceiptImage(receiptUri, user.uid) : null

      const isIncome = type === 'Depósito' || type === 'Pix'
      const finalAmount = isIncome ? Math.abs(numericAmount) : -Math.abs(numericAmount)

      const success = await addTransaction({
        type,
        name: name.trim(),
        amount: finalAmount,
        date,
        category,
        receiptUrl: receiptUrl || undefined,
      } as any)

      if (success) {
        setType('')
        setCategory('')
        setName('')
        setAmount('')
        setDate('')
        setReceiptUri(null)
        setErrors({})
        setIsModalOpen(false)
      } else {
        setErrors({ general: 'Não foi possível salvar a transação.' })
      }
    } catch (error) {
      console.error(error)
      setErrors({ general: 'Ocorreu um erro inesperado.' })
    } finally {
      setLoadingCreate(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Typography variant="title-lg" color="active" weight="bold">Olá!</Typography>
            <Typography variant="body-sm" color="placeholder">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Typography>
          </View>
          <PopupMenu align="right" items={[{ id: 'logout', label: 'Sair', onClick: () => router.replace('/login') }]}>
            <Avatar />
          </PopupMenu>
        </View>

        <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Paper color="primary" style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <Typography color="white">Saldo</Typography>
              <Pressable onPress={() => setBalanceVisible((c) => !c)}>
                <Typography color="white">{balanceVisible ? 'Ocultar' : 'Mostrar'}</Typography>
              </Pressable>
            </View>
            <Typography variant="title-lg" color="white" weight="bold">
              {balanceVisible ? formatCurrency(balance) : 'R$ ••••••'}
            </Typography>
            <Typography variant="body-sm" color="white">Conta corrente</Typography>
          </Paper>

          <Button size="large" fullWidth onPress={() => { setErrors({}); setIsModalOpen(true); }}>
            Nova transação
          </Button>

          <View style={styles.sectionHeader}>
            <Typography variant="title-lg" color="active" weight="bold">Análises financeiras</Typography>
          </View>

          <Paper style={styles.chartCard}>
            <Chart title="Evolução do Saldo Acumulado" type="line" data={balanceEvolutionData} series={[{ key: 'value', name: 'Saldo', color: colors.primary }]} axis={{ x: { key: 'label', show: true }, y: { show: true } }} />
          </Paper>

          <Paper style={styles.chartCard}>
            <Chart title="Fluxo de Caixa: Entradas vs Saídas" type="bar" data={last3MonthsData} series={[{ key: 'Entradas', name: 'Entradas', color: colors.success }, { key: 'Saidas', name: 'Saídas', color: colors.secondary }]} axis={{ x: { key: 'name', show: true }, y: { show: true } }} />
          </Paper>

          <Paper style={styles.chartCard}>
            <Chart title="Distribuição por tipo" type="pie" data={typeData} series={[{ key: 'value', name: 'Valor' }]} axis={{ x: { show: false }, y: { show: false } }} />
          </Paper>

          <Paper style={styles.statement}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="title-lg" color="active" weight="bold">Últimas transações</Typography>
              <Pressable onPress={() => router.push('/transactions')}>
                <Typography variant="body-sm" color="active" weight="bold" style={{ textDecorationLine: 'underline' }}>Ver todas</Typography>
              </Pressable>
            </View>

            {transactions.length === 0 ? (
              <Typography color="active">Nenhuma transação encontrada.</Typography>
            ) : (
              transactions.slice(0, 3).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  type={transaction.type}
                  name={transaction.name}
                  amount={transaction.amount}
                  date={formatDate(transaction.date)}
                  receiptUrl={(transaction as any).receiptUrl}
                />
              ))
            )}
          </Paper>
        </Animated.View>
      </ScrollView>

      <NewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        setType={setType}
        category={category}
        setCategory={setCategory}
        name={name}
        setName={setName}
        amount={amount}
        handleAmountChange={handleAmountChange}
        date={date}
        setDate={setDate}
        receiptUri={receiptUri}
        pickImage={pickImage}
        setReceiptUri={setReceiptUri}
        errors={errors}
        loading={loadingCreate}
        onSubmit={createTransaction}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.tertiary },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 40 },
  animatedContainer: { gap: 16 },
  balanceCard: { gap: 8, padding: 20 },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { marginTop: 8 },
  chartCard: { padding: 12, overflow: 'hidden' },
  statement: { gap: 12, padding: 16 },
})