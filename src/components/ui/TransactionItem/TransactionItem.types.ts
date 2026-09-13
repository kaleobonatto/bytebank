import type { StyleProp, ViewStyle } from 'react-native'

export type TransactionItemProps = {
  type: string
  name?: string
  amount: number
  date: string
  onDelete?: () => void
  style?: StyleProp<ViewStyle>
}