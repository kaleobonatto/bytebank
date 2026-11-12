import type { TransactionType } from '@/domain/entities/Transaction'

export interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  initial?: {
    id?: string
    type: TransactionType
    name: string
    amount: number
  }
  onSubmit: (payload: {
    id?: string
    type: TransactionType
    name: string
    amount: number
  }) => Promise<void>
}
