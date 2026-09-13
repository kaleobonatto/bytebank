import { Linking, Pressable, View } from 'react-native'

import Icon from '../Icon/Icon'
import Typography from '../Typography/Typography'

import { styles } from './TransactionItem.styles'
import type { TransactionItemProps } from './TransactionItem.types'

export default function TransactionItem({
  type,
  name,
  amount,
  date,
  receiptUrl,
  onDelete,
  onEdit,
  style,
}: TransactionItemProps & { onDelete?: () => void; onEdit?: () => void; receiptUrl?: string }) {
  const amountStyle = [
    styles.amount,
    amount >= 0 ? styles.amountPositive : styles.amountNegative,
  ]

  return (
    <View style={[styles.transactionItem, style]}>
      <View style={styles.body}>
        <View style={styles.rowTop}>
          <View style={styles.leftStack}>
            <Typography
              variant="body-sm"
              weight="bold"
              style={styles.typeText}
            >
              {type}
            </Typography>

            <Typography variant="body-sm" style={styles.dateText}>
              {date}
            </Typography>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {receiptUrl ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ver recibo anexado"
                onPress={() => Linking.openURL(receiptUrl)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: 'rgba(0, 77, 97, 0.08)' },
                  pressed && { backgroundColor: 'rgba(0, 77, 97, 0.2)' },
                ]}
              >
                <Icon name="attachment" size={18} color="#004d61" />
              </Pressable>
            ) : null}

            {onEdit ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar transação"
                onPress={onEdit}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
              >
                <Icon name="edit" size={20} color="#004d61" />
              </Pressable>
            ) : null}

            {onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir transação"
                onPress={onDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
              >
                <Icon name="delete-outline" size={20} color="#d33418" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {name ? (
          <Typography variant="body-sm" style={styles.nameText}>
            {name}
          </Typography>
        ) : null}

        <Typography variant="body-sm" weight="bold" style={amountStyle}>
          {amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </Typography>
      </View>
    </View>
  )
}