import { Link, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'

import { AuthLayout } from '@/components/auth/auth-layout'
import { Button, Input, Typography } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { auth } from '@/services/firebase'
import { theme } from '@/styles/variables'

export default function CadastroScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!email.trim() || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.')
      return
    }

    try {
      setLoading(true)
      await createUserWithEmailAndPassword(auth, email.trim(), senha)
      Alert.alert('Sucesso', 'Conta criada com sucesso!')
      router.replace('/home')
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error)

      let mensagem = 'Não foi possível criar a conta.'
      if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está cadastrado.'
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'O e-mail digitado não é válido.'
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'A senha precisa ter pelo menos 6 caracteres.'
      }

      Alert.alert('Erro no cadastro', mensagem)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Crie sua conta ByteBank"
      footer={
        <Link href="/login" asChild>
          <Pressable style={styles.footerLink}>
            <Typography variant="body-sm" color="disabled">
              Já tem uma conta?
            </Typography>
            <Typography variant="body-sm" style={styles.footerAction}>
              Entrar
            </Typography>
          </Pressable>
        </Link>
      }
    >
      <View style={styles.field}>
        <Typography variant="title" color="active">
          E-mail
        </Typography>
        <Input
          fullWidth
          paddingSize="large"
          placeholder="seu@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <Typography variant="title" color="active">
          Senha
        </Typography>
        <Input
          fullWidth
          paddingSize="large"
          placeholder="Digite sua senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
      </View>

      <View style={styles.field}>
        <Typography variant="title" color="active">
          Confirmar senha
        </Typography>
        <Input
          fullWidth
          paddingSize="large"
          placeholder="Digite a senha novamente"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
        />
      </View>

      <Button fullWidth size="large" onPress={handleSignUp} disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </AuthLayout>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
    width: '100%',
  },
  footerLink: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  footerAction: {
    color: theme.colors.orange,
    fontFamily: 'Inter_600SemiBold',
  },
})