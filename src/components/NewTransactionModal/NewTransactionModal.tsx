import Datepicker from '@/components/Datepicker/Datepicker'
import Button from '@/components/ui/Button/Button'
import Icon from '@/components/ui/Icon/Icon'
import Input from '@/components/ui/Input/Input'
import Modal from '@/components/ui/Modal/Modal'
import Select from '@/components/ui/Select/Select'
import Typography from '@/components/ui/Typography/Typography'
import { colors } from '@/styles/colors'
import type { TransactionType } from '@/types/transaction'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'

const typeOptions = [
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

interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type: TransactionType | ''
  setType: (val: TransactionType | '') => void
  category: string
  setCategory: (val: string) => void
  name: string
  setName: (val: string) => void
  amount: string
  handleAmountChange: (text: string) => void
  date: string
  setDate: (val: string) => void
  receiptUri: string | null
  pickImage: () => void
  setReceiptUri: (uri: string | null) => void
  errors: Record<string, string>
  loading: boolean
  onSubmit: () => void
}

export default function NewTransactionModal({
  isOpen,
  onClose,
  type,
  setType,
  category,
  setCategory,
  name,
  setName,
  amount,
  handleAmountChange,
  date,
  setDate,
  receiptUri,
  pickImage,
  setReceiptUri,
  errors,
  loading,
  onSubmit,
}: NewTransactionModalProps) {
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
              Nova Transação
            </Typography>
            <Typography variant="body-sm" color="placeholder">
              Insira as informações da sua nova movimentação
            </Typography>
          </View>
          
          <View style={styles.inputGroupWrapper}>
            <View style={[styles.fieldContainer, { zIndex: 300 }]}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Tipo de Transação
              </Typography>
              <Select
                placeholder="Selecione o tipo"
                options={typeOptions}
                value={type}
                onChange={(value) => setType(value as TransactionType)}
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
                onChange={setCategory}
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
                onChangeText={setName}
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
                onChangeText={handleAmountChange}
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
                onChange={(selectedDate) => setDate(selectedDate.toISOString().slice(0, 10))}
                style={styles.datePickerStyle}
              />
              {errors.date ? <Typography variant="body-sm" color="error">{errors.date}</Typography> : null}
            </View>

            <View style={styles.fieldContainer}>
              <Typography variant="body-sm" color="active" weight="bold" style={styles.fieldLabel}>
                Comprovante / Recibo (Opcional)
              </Typography>
              <Pressable onPress={pickImage} style={styles.uploadButton}>
                <Icon name="attach-file" size={20} color={colors.primary} />
                <Typography variant="body-sm" color="active">
                  {receiptUri ? 'Recibo anexado com sucesso!' : 'Selecionar imagem do recibo'}
                </Typography>
              </Pressable>
              {receiptUri && (
                <View style={{ marginTop: 6, gap: 6 }}>
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
                  <Pressable onPress={() => setReceiptUri(null)} style={styles.removeImageButton}>
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
            onPress={onSubmit} 
            disabled={loading} 
            style={styles.submitButton}
          >
            {loading ? 'Salvando...' : 'Concluir Transação'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modernFormContainer: { gap: 16, width: '100%' },
  modalHeader: { gap: 2, marginBottom: 4 },
  inputGroupWrapper: { gap: 10 },
  fieldContainer: { gap: 4 },
  fieldLabel: { fontSize: 13, color: colors.primary, fontFamily: 'Inter_600SemiBold' },
  inputStyle: { backgroundColor: '#ffffff', borderColor: colors.primary, borderWidth: 1.5, borderRadius: 8 },
  selectStyle: { backgroundColor: '#ffffff', borderColor: colors.primary, borderWidth: 1.5, borderRadius: 8 },
  datePickerStyle: { backgroundColor: '#ffffff', borderColor: colors.primary, borderWidth: 1.5, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 1.5, borderRadius: 8, padding: 12 },
  receiptPreview: { width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' },
  removeImageButton: { alignSelf: 'flex-end', backgroundColor: '#d33418', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  submitButton: { marginTop: 6, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14 },
})