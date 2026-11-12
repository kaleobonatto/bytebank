export type TransactionType = 'Transferência' | 'Pix' | 'Depósito' | 'Pagamento'

export type TransactionCategory =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Salário'
  | 'Transferências'
  | 'Outros'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  name: string
  amount: number
  date: string
  category?: TransactionCategory | string
  receiptUrl?: string | null
}

// Tipo auxiliar para quando formos criar uma nova transação (ainda não tem ID nem userId atrelado)
export type CreateTransactionDTO = Omit<Transaction, 'id' | 'userId'>