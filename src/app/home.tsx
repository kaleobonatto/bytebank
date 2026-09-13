import { useRouter } from 'expo-router'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Avatar from '@/components/Avatar/Avatar'
import Datepicker from '@/components/Datepicker/Datepicker'
import {
  Button,
  Chart,
  Input,
  Modal,
  Paper,
  PopupMenu,
  Select,
  TransactionItem,
  Typography,
} from '@/components/ui'
import { auth, db } from '@/services/firebase'
import { colors } from '@/styles/colors'
import type { Transaction, TransactionType } from '@/types/transaction'

const typeOptions = [
  { value: 'Depósito', label: 'Depósito' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Transferência', label: 'Transferência' },
  { value: 'Pagamento', label: 'Pagamento' },
]

const categoryOptions = [
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Moradia', label: 'Moradia' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Lazer', label: 'Lazer' },
  { value: 'Educação', label: 'Educação' },
  { value: 'Salário', label: 'Salário' },
  { value: 'Outros', label: 'Outros' },
]

const formatDate = (value: string) => {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

export default function Home() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [type, setType] = useState<TransactionType | ''>('')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [loadingCreate, setLoadingCreate] = useState(false)

  // Variáveis de Animação (Animated nativo do React Native)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    // Dispara a animação suave de entrada ao carregar o dashboard
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    fetchHomeTransactions()
  }, [])

  const fetchHomeTransactions = async () => {
    const user = auth?.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid)
      )
      const snapshot = await getDocs(q)
      const data: Transaction[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Transaction[]

      setTransactions(data)
    } catch (error) {
      console.error('Erro ao buscar transações da home:', error)
    }
  }

  const balance = transactions.reduce((total, item) => total + item.amount, 0)
  
  // 1. Dados para o Gráfico de Evolução do Saldo Acumulado
  const sortedTransactions = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1))
  let runningBalance = 0
  const balanceEvolutionData = sortedTransactions.length > 0
    ? sortedTransactions.map((item) => {
        runningBalance += item.amount
        const [y, m, d] = item.date.split('-')
        const shortDate = d && m ? `${d}/${m}` : item.date
        return {
          value: runningBalance,
          label: shortDate,
        }
      })
    : [
        { value: 0, label: 'Início' },
        { value: balance, label: 'Atual' }
      ]

  // 2. Dados para o Gráfico de Pizza por Tipo
  const typeMap: Record<string, number> = {
    'Depósito': 0,
    'Pix': 0,
    'Transferência': 0,
    'Pagamento': 0,
  }

  transactions.forEach((item) => {
    if (typeMap[item.type] !== undefined) {
      typeMap[item.type] += Math.abs(item.amount)
    }
  })

  const typeData = Object.keys(typeMap)
    .map((typeName) => ({
      name: typeName,
      value: typeMap[typeName],
    }))
    .filter((item) => item.value > 0)

  // 3. Dados de Fluxo de Caixa (Últimos 3 meses)
  const now = new Date()
  const last3MonthsData = []
  
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const label = `${monthNames[d.getMonth()]} ${year}`

    const monthTransactions = transactions.filter((item) => {
      if (!item.date) return false
      return item.date.startsWith(`${year}-${month}`)
    })

    const entradas = monthTransactions
      .filter((item) => item.amount > 0)
      .reduce((acc, item) => acc + item.amount, 0)

    const saidas = monthTransactions
      .filter((item) => item.amount < 0)
      .reduce((acc, item) => acc + Math.abs(item.amount), 0)

    last3MonthsData.push({
      name: label,
      Entradas: entradas,
      Saidas: saidas,
    })
  }

  const handleAmountChange = (text: string) => {
    const cleanNumeric = text.replace(/\D/g, '')
    if (!cleanNumeric) {
      setAmount('')
      return
    }
    const numberValue = Number(cleanNumeric) / 100
    setAmount(
      numberValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    )
  }

  async function createTransaction() {
    const user = auth?.currentUser
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado.')
      return
    }

    const rawNumberString = amount
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    
    const numericAmount = Number(rawNumberString)

    if (!type || !name.trim() || !numericAmount || isNaN(numericAmount) || !date || !category) {
      Alert.alert('Nova transação', 'Preencha todos os campos corretamente.')
      return
    }

    try {
      setLoadingCreate(true)
      const isIncome = type === 'Depósito' || type === 'Pix'
      const finalAmount = isIncome ? Math.abs(numericAmount) : -Math.abs(numericAmount)

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type,
        name: name.trim(),
        amount: finalAmount,
        date,
        category,
      })

      setType('')
      setCategory('')
      setName('')
      setAmount('')
      setDate('')
      setIsModalOpen(false)

      await fetchHomeTransactions()
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      Alert.alert('Erro', 'Não foi possível salvar a transação.')
    } finally {
      setLoadingCreate(false)
    }
  }

  function removeTransaction(id: string) {
    Alert.alert('Excluir transação', 'Deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'transactions', id))
            await fetchHomeTransactions()
          } catch (error) {
            console.error('Erro ao excluir transação:', error)
            Alert.alert('Erro', 'Não foi possível excluir o item.')
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Typography variant="title-lg" color="active" weight="bold">
              Olá!
            </Typography>
            <Typography variant="body-sm" color="placeholder">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Typography>
          </View>
          <PopupMenu
            align="right"
            items={[
              {
                id: 'logout',
                label: 'Sair',
                onClick: () => router.replace('/login'),
              },
            ]}
          >
            <Avatar />
          </PopupMenu>
        </View>

        {/* Bloco Animado Envolvendo o Dashboard Principal */}
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Card de Saldo */}
          <Paper color="primary" style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <Typography color="white">Saldo</Typography>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  balanceVisible ? 'Ocultar saldo' : 'Mostrar saldo'
                }
                onPress={() => setBalanceVisible((current) => !current)}
              >
                <Typography color="white">{balanceVisible ? 'Ocultar' : 'Mostrar'}</Typography>
              </Pressable>
            </View>
            <Typography variant="title-lg" color="white" weight="bold">
              {balanceVisible ? formatCurrency(balance) : 'R$ ••••••'}
            </Typography>
            <Typography variant="body-sm" color="white">
              Conta corrente
            </Typography>
          </Paper>

          {/* Botão de Nova Transação logo abaixo do Saldo */}
          <Button size="large" fullWidth onPress={() => setIsModalOpen(true)}>
            Nova transação
          </Button>

          {/* Seção de Gráficos Analíticos */}
          <View style={styles.sectionHeader}>
            <Typography variant="title-lg" color="active" weight="bold">
              Análises financeiras
            </Typography>
          </View>

          <Paper style={styles.chartCard}>
            <Chart
              title="Evolução do Saldo Acumulado"
              type="line"
              data={balanceEvolutionData}
              series={[{ key: 'value', name: 'Saldo', color: colors.primary }]}
              axis={{ x: { key: 'label', show: true }, y: { show: true } }}
            />
          </Paper>

          <Paper style={styles.chartCard}>
            <Chart
              title="Fluxo de Caixa: Entradas vs Saídas"
              type="bar"
              data={last3MonthsData}
              series={[
                { key: 'Entradas', name: 'Entradas', color: colors.success },
                { key: 'Saidas', name: 'Saídas', color: colors.secondary },
              ]}
              axis={{ x: { key: 'name', show: true }, y: { show: true } }}
            />
          </Paper>

          <Paper style={styles.chartCard}>
            <Chart
              title="Distribuição por tipo"
              type="pie"
              data={typeData.length > 0 ? typeData : [{ name: 'Nenhuma', value: 1 }]}
              series={[{ key: 'value', name: 'Valor' }]}
              axis={{ x: { show: false }, y: { show: false } }}
            />
          </Paper>

          {/* Seção de Últimas Transações (Resumo) com Botão de Exclusão por Lixeira */}
          <Paper style={styles.statement}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="title-lg" color="active" weight="bold">
                Últimas transações
              </Typography>
              
              <Pressable onPress={() => router.push('/transactions')}>
                <Typography variant="body-sm" color="active" weight="bold" style={{ textDecorationLine: 'underline' }}>
                  Ver todas
                </Typography>
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
                  onDelete={() => removeTransaction(transaction.id)}
                />
              ))
            )}
          </Paper>
        </Animated.View>
      </ScrollView>

      {/* Modal de Nova Transação */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          style={{ width: '100%', maxHeight: '85%' }}
        >
          <ScrollView 
            contentContainerStyle={styles.modernFormContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Typography variant="title-lg" color="active" weight="bold">
                Nova Transação
              </Typography>
              <Typography variant="body-sm" color="placeholder">
                Insira as informações da sua nova movimentação
              </Typography>
            </View>
            
            <View style={styles.inputGroupWrapper}>
              <View style={[styles.fieldContainer, { zIndex: 300 }]}>
                <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                  Tipo de Transação
                </Typography>
                <Select
                  placeholder="Selecione o tipo"
                  options={typeOptions}
                  value={type}
                  onChange={(value) => setType(value as TransactionType)}
                  style={styles.selectStyle}
                />
              </View>

              <View style={[styles.fieldContainer, { zIndex: 200 }]}>
                <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                  Categoria
                </Typography>
                <Select
                  placeholder="Selecione a categoria"
                  options={categoryOptions}
                  value={category}
                  onChange={setCategory}
                  style={styles.selectStyle}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                  Descrição
                </Typography>
                <Input
                  paddingSize="large"
                  placeholder="Ex: Supermercado, Aluguel..."
                  value={name}
                  onChangeText={setName}
                  style={styles.inputStyle}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                  Valor (R$)
                </Typography>
                <Input
                  paddingSize="large"
                  placeholder="R$ 0,00"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChange}
                  style={styles.inputStyle}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                  Data da Transação
                </Typography>
                <Datepicker
                  value={date}
                  placeholder="DD/MM/AAAA"
                  onChange={(selectedDate) =>
                    setDate(selectedDate.toISOString().slice(0, 10))
                  }
                  style={styles.datePickerStyle}
                />
              </View>
            </View>

            <Button 
              size="large" 
              fullWidth 
              onPress={createTransaction} 
              disabled={loadingCreate} 
              style={styles.submitButton}
            >
              {loadingCreate ? 'Salvando...' : 'Concluir Transação'}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.tertiary,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  animatedContainer: {
    gap: 16,
  },
  balanceCard: {
    gap: 8,
    padding: 20,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: 8,
  },
  chartCard: {
    padding: 12,
    overflow: 'hidden',
  },
  statement: {
    gap: 12,
    padding: 16,
  },
  modernFormContainer: {
    gap: 16,
    width: '100%',
  },
  modalHeader: {
    gap: 2,
    marginBottom: 4,
  },
  inputGroupWrapper: {
    gap: 10,
  },
  fieldContainer: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  inputStyle: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  selectStyle: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  datePickerStyle: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
})