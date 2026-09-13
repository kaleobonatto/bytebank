import { colors } from '@/styles/colors'
import type { Transaction } from '@/types/transaction'

export function calculateHomeMetrics(transactions: Transaction[]) {
  const balance = transactions.reduce((total, item) => total + item.amount, 0)
  
  const sortedTransactions = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1))
  let runningBalance = 0
  const balanceEvolutionData = sortedTransactions.length > 0
    ? sortedTransactions.map((item) => {
        runningBalance += item.amount
        const [y, m, d] = item.date.split('-')
        const shortDate = d && m ? `${d}/${m}` : item.date
        return { value: runningBalance, label: shortDate }
      })
    : [{ value: 0, label: 'Início' }, { value: balance, label: 'Atual' }]

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
    .map((typeName) => ({ name: typeName, value: typeMap[typeName], color: colors.primary }))
    .filter((item) => item.value > 0)

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

    last3MonthsData.push({ name: label, Entradas: entradas, Saidas: saidas })
  }

  return {
    balance,
    balanceEvolutionData,
    typeData: typeData.length > 0 ? typeData : [{ name: 'Nenhuma', value: 1 }],
    last3MonthsData,
  }
}