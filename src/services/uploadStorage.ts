export async function uploadReceiptImage(uri: string, userId: string): Promise<string | null> {
  try {
    // Como o Storage é pago, salvamos a URI local ou os dados da imagem diretamente no documento do Firestore no plano gratuito do Firebase.
    return uri
  } catch (error) {
    console.error('Erro ao processar recibo:', error)
    return null
  }
}