import { StyleSheet } from 'react-native'

import { colors } from '../../../styles/colors'

export const styles = StyleSheet.create({
  transactionItem: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 77, 97, 0.12)',
  },

  body: {
    flex: 1,
    minWidth: 0,
  },

  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },

  leftStack: {
    flexDirection: 'column',
    gap: 2,
  },

  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(211, 52, 24, 0.08)',
  },

  deleteButtonPressed: {
    backgroundColor: 'rgba(211, 52, 24, 0.2)',
  },

  typeText: {
    color: colors.primary,
  },

  dateText: {
    color: colors.typographyActive,
    flexShrink: 0,
  },

  nameText: {
    color: colors.typographyActive,
    marginBottom: 4,
    marginRight: 4,
  },

  amount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 24,
  },

  amountPositive: {
    color: colors.success,
  },

  amountNegative: {
    color: colors.secondary,
  },
})