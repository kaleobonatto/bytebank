import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import Datepicker from '@/components/Datepicker/Datepicker'
import Button from '@/components/ui/Button/Button'
import Icon from '@/components/ui/Icon/Icon'
import Input from '@/components/ui/Input/Input'
import Modal from '@/components/ui/Modal/Modal'
import Select from '@/components/ui/Select/Select'
import Typography from '@/components/ui/Typography/Typography'
import { colors } from '@/styles/colors'

import type { TransactionType } from '@/types/transaction'

const transactionOptions = [
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

interface Props {
  isOpen: boolean
  onClose: () => void
  initial?: {
    id?: string
    type: TransactionType
    name: string
    amount: number
    date?: string
    category?: string
    receiptUrl?: string
  }
  onSubmit: (payload: {
    id?: string
    type: TransactionType
    name: string
    amount: number
    date: string
    category: string
    receiptUrl?: string | null
  }) => Promise<void>
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  initial,
  onSubmit,
}: Props) {
  const [type, setType] = useState<TransactionType | ''>(initial?.type ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [receiptUri, setReceiptUri] = useState<string | null>(initial?.receiptUrl ?? null)
  
  const initialFormattedAmount = initial?.amount !== undefined
    ? Math.abs(initial.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : ''

  const [amount, setAmount] = useState(initialFormattedAmount)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    type?: string
    category?: string
    name?: string
    amount?: string
    date?: string
    general?: string
  }>({})

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0].uri) {
      setReceiptUri(result.assets[0].uri)
    }
  }

  const handleSubmit = async () => {
    const newErrors: typeof errors = {}

    if (!type) newErrors.type = 'O tipo de transação é obrigatório.'
    if (!category) newErrors.category = 'A categoria é obrigatória.'
    if (!name.trim()) newErrors.name = 'A descrição não pode estar vazia.'

    const rawNumberString = amount
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    
    const numericAmount = Number(rawNumberString)

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'O valor deve ser maior que zero.'
    }

    if (!date) newErrors.date = 'A data da transação é obrigatória.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    try {
      setLoading(true)
      await onSubmit({
        id: initial?.id,
        type: type as TransactionType,
        name: name.trim(),
        amount: numericAmount,
        date,
        category,
        receiptUrl: receiptUri,
      })
    } catch (err) {
      setErrors({ general: 'Erro ao salvar alterações.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
              Editar Transação
            </Typography>
            <Typography variant="body-sm" color="placeholder">
              Atualize as informações da sua movimentação
            </Typography>
          </View>
          
          <View style={styles.inputGroupWrapper}>
            <View style={[styles.fieldContainer, { zIndex: 300 }]}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Tipo de Transação
              </Typography>
              <Select
                placeholder="Selecione o tipo"
                options={transactionOptions}
                value={type}
                onChange={(value) => { setType(value as TransactionType); setErrors(e => ({ ...e, type: undefined })) }}
                style={styles.selectStyle}
              />
              {errors.type ? <Typography variant="body-sm" color="error">{errors.type}</Typography> : null}
            </View>

            <View style={[styles.fieldContainer, { zIndex: 200 }]}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Categoria
              </Typography>
              <Select
                placeholder="Selecione a categoria"
                options={categoryOptions}
                value={category}
                onChange={(val) => { setCategory(val); setErrors(e => ({ ...e, category: undefined })) }}
                style={styles.selectStyle}
              />
              {errors.category ? <Typography variant="body-sm" color="error">{errors.category}</Typography> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Descrição
              </Typography>
              <Input
                paddingSize="large"
                placeholder="Ex: Supermercado, Aluguel..."
                value={name}
                onChangeText={(val) => { setName(val); setErrors(e => ({ ...e, name: undefined })) }}
                style={styles.inputStyle}
              />
              {errors.name ? <Typography variant="body-sm" color="error">{errors.name}</Typography> : null}
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
                onChangeText={(val) => { handleAmountChange(val); setErrors(e => ({ ...e, amount: undefined })) }}
                style={styles.inputStyle}
              />
              {errors.amount ? <Typography variant="body-sm" color="error">{errors.amount}</Typography> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Data da Transação
              </Typography>
              <Datepicker
                value={date}
                placeholder="DD/MM/AAAA"
                onChange={(selectedDate) => {
                  setDate(selectedDate.toISOString().slice(0, 10))
                  setErrors(e => ({ ...e, date: undefined }))
                }}
                style={styles.datePickerStyle}
              />
              {errors.date ? <Typography variant="body-sm" color="error">{errors.date}</Typography> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Comprovante / Recibo
              </Typography>
              <Pressable onPress={pickImage} style={styles.uploadButton}>
                <Icon name="attach-file" size={20} color={colors.primary} />
                <Typography variant="body-sm" color="active">
                  {receiptUri ? 'Trocar imagem do recibo' : 'Anexar comprovante'}
                </Typography>
              </Pressable>

              {receiptUri && (
                <View style={styles.previewContainer}>
                  <Pressable 
                    onPress={() => setReceiptUri(null)}
                    style={styles.removeImageButton}
                  >
                    <Typography variant="body-sm" style={{ color: '#fff', fontSize: 12 }}>Remover anexo</Typography>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {errors.general ? (
            <Typography variant="body-sm" color="error" style={{ textAlign: 'center' }}>
              {errors.general}
            </Typography>
          ) : null}

          <Button 
            size="large" 
            fullWidth 
            onPress={handleSubmit} 
            disabled={loading} 
            style={styles.submitButton}
          >
            {loading ? 'Atualizando...' : 'Salvar alterações'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
  },
  previewContainer: {
    marginTop: 6,
    gap: 6,
  },
  receiptPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#d33418',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
})