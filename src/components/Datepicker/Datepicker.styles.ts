// src/components/Datepicker/Datepicker.styles.ts
import { StyleSheet } from 'react-native'
import { colors } from '../../styles/colors'

export const styles = StyleSheet.create({
  datepicker: {
    width: '100%',
    gap: 4,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
input: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.primary,
    height: 48,
    paddingHorizontal: 14,
    width: '100%',
  },
  medium: {
    height: 48,
  },
  large: {
    height: 48,
  },
  fullwidth: {
    width: '100%',
  },
  default: {
    borderColor: colors.primary,
  },
  secondary: {
    borderColor: colors.secondary,
    color: colors.secondary,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  ghost: {
    borderWidth: 0,
    backgroundColor: colors.tertiary,
    color: colors.typographyActive,
  },
  disabled: {
    opacity: 0.8,
    borderColor: colors.disabledColor,
  },
  placeholder: {
    color: colors.typographyPlaceholder,
  },
})