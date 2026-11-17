import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadReceiptImage(uri: string, userId: string): Promise<string | null> {
  try {
    // Transforma a URI local em Blob para envio
    const response = await fetch(uri)
    const blob = await response.blob()

    // Define o caminho no Storage: receipts/ID_DO_USUARIO/timestamp.jpg
    const filename = `receipt_${Date.now()}.jpg`
    const storageRef = ref(storage, `receipts/${userId}/${filename}`)

    // Faz o upload
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
    
    // Retorna a URL pública (para renderizar na UI)
    const downloadUrl = await getDownloadURL(storageRef)
    return downloadUrl
  } catch (error) {
    console.error('Erro ao fazer upload do recibo:', error)
    return null
  }
}