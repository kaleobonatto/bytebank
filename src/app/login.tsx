import { Link, useRouter } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'

import { AuthLayout } from '@/components/auth/auth-layout'
import { Button, Input, Typography } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { auth } from '@/services/firebase'
import { theme } from '@/styles/variables'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.')
      return
    }

    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email.trim(), senha)
      router.replace('/home')
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)

      let mensagem = 'Verifique suas credenciais e tente novamente.'
      if (error.code === 'auth/invalid-email') {
        mensagem = 'O e-mail digitado não é válido.'
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password'
      ) {
        mensagem = 'E-mail ou senha incorretos.'
      }

      Alert.alert('Erro no login', mensagem)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta ByteBank"
      footer={
        <Link href="/cadastro" asChild>
          <Pressable style={styles.footerLink}>
            <Typography variant="body-sm" color="disabled">
              Não tem uma conta?
            </Typography>
            <Typography variant="body-sm" style={styles.footerAction}>
              Criar conta
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

      <Button fullWidth size="large" onPress={handleLogin} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
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