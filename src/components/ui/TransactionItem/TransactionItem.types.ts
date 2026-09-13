import type { StyleProp, ViewStyle } from 'react-native'

export type TransactionItemProps = {
  type: string
  name?: string
  amount: number
  date: string
  receiptUrl?: string
  onDelete?: () => void
  onEdit?: () => void
  style?: StyleProp<ViewStyle>
}