import { gcm } from '@noble/ciphers/aes'
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils'
import * as Crypto from 'expo-crypto'

// Lê ESTRITAMENTE do arquivo .env
const SECRET_ENV = process.env.EXPO_PUBLIC_CRYPTO_SECRET

if (!SECRET_ENV) {
  throw new Error('ATENÇÃO: A variável EXPO_PUBLIC_CRYPTO_SECRET não está definida no arquivo .env')
}

// O AES-256 exige uma chave de exatos 32 bytes.
// Transformamos o texto em bytes e garantimos que o tamanho seja de exatamente 32 posições (truncando ou preenchendo com zeros).
const rawBytes = utf8ToBytes(SECRET_ENV)
const SECRET_KEY = new Uint8Array(32)
SECRET_KEY.set(rawBytes.slice(0, 32))

export const cryptoService = {
  encrypt: (data: any): string => {
    const stringifiedData = JSON.stringify(data)
    
    // Gera 12 bytes aleatórios de forma nativa e segura (Hardware level)
    const nonce = Crypto.getRandomBytes(12) 
    
    // Instancia o algoritmo AES-GCM com a nossa chave e o nonce
    const cipher = gcm(SECRET_KEY, nonce)
    const encryptedBytes = cipher.encrypt(utf8ToBytes(stringifiedData))
    
    // Retornamos o nonce + os dados criptografados unidos por um ponto.
    return `${bytesToHex(nonce)}.${bytesToHex(encryptedBytes)}`
  },

  decrypt: <T>(encryptedText: string): T | null => {
    try {
      // Separa o nonce dos dados criptografados
      const [nonceHex, dataHex] = encryptedText.split('.')
      
      if (!nonceHex || !dataHex) return null

      const nonce = hexToBytes(nonceHex)
      const dataBytes = hexToBytes(dataHex)
      
      // Desfaz a criptografia
      const cipher = gcm(SECRET_KEY, nonce)
      const decryptedBytes = cipher.decrypt(dataBytes)
      
      // Converte de volta para string e depois para Objeto (JSON)
      const decryptedString = bytesToUtf8(decryptedBytes)
      return JSON.parse(decryptedString) as T
      
    } catch (error) {
      console.error('Erro ao descriptografar dados do cache:', error)
      return null
    }
  }
}