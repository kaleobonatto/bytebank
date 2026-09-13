import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { Platform, StyleSheet, TextInput, View } from 'react-native'

import Typography from '../ui/Typography/Typography'
import { styles } from './Datepicker.styles'
import { DatepickerProps } from './Datepicker.types'

const toInputDate = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''

export default function Datepicker({
  paddingSize = 'medium',
  variant = 'default',
  fullWidth,
  disabled,
  inline,
  id,
  label,
  value,
  placeholder = 'AAAA-MM-DD ou DD/MM/AAAA',
  minimumDate,
  maximumDate,
  style,
  onChange,
}: DatepickerProps) {
  const [textValue, setTextValue] = useState('')

  useEffect(() => {
    if (value) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-')
        setTextValue(`${day}/${month}/${year}`)
      } else {
        setTextValue(value)
      }
    }
  }, [value])

  const inputStyle = StyleSheet.flatten([
    styles.input,
    styles[paddingSize],
    styles[variant],
    fullWidth && styles.fullwidth,
    disabled && styles.disabled,
    style,
  ]) as CSSProperties

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.datepicker, inline && styles.inline]}>
        {label ? <Typography style={styles.label}>{label}</Typography> : null}
        <input
          aria-label={label ?? placeholder}
          disabled={disabled}
          id={id}
          max={maximumDate?.toISOString().slice(0, 10)}
          min={minimumDate?.toISOString().slice(0, 10)}
          onChange={(event) => {
            const dateObj = new Date(`${event.target.value}T00:00:00`)
            onChange?.(dateObj)
          }}
          placeholder={placeholder}
          style={{
            ...(inputStyle as Record<string, any>),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
          type="date"
          value={toInputDate(value)}
        />
      </View>
    )
  }

  return (
    <View style={[styles.datepicker, inline && styles.inline]}>
      {label ? <Typography style={styles.label}>{label}</Typography> : null}
      <TextInput
        editable={!disabled}
        id={id}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        style={inputStyle as any}
        value={textValue}
        onChangeText={(text) => {
          setTextValue(text)
          // Formata automaticamente ou converte se tiver o tamanho ideal
          const cleaned = text.replace(/\D/g, '')
          if (cleaned.length === 8) {
            const day = cleaned.slice(0, 2)
            const month = cleaned.slice(2, 4)
            const year = cleaned.slice(4, 8)
            const parsed = new Date(`${year}-${month}-${day}T00:00:00`)
            if (!Number.isNaN(parsed.getTime())) {
              onChange?.(parsed)
            }
          }
        }}
        keyboardType="numeric"
        maxLength={10}
      />
    </View>
  )
}