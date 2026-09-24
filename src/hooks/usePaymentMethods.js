import { useEffect, useState } from 'react'
import { db, doc, onSnapshot } from '../supabase'

const PADRAO = { pix: true, debito: true, credito: true, dinheiro: true }

// Lê config/pagamentos no Supabase PostgreSQL (gerenciado pelo admin) em tempo real,
// pra saber quais formas de pagamento estão liberadas hoje para os clientes.
// Se o documento não existir ainda, todas as formas ficam disponíveis
// (mesmo comportamento de antes, nada muda até o admin desativar alguma).
export function usePaymentMethods() {
  const [metodos, setMetodos] = useState(PADRAO)

  useEffect(() => {
    const ref = doc(db, 'config', 'pagamentos')
    const unsubscribe = onSnapshot(
      ref,
      snap => {
        if (!snap.exists()) {
          setMetodos(PADRAO)
          return
        }
        setMetodos({ ...PADRAO, ...snap.data() })
      },
      () => setMetodos(PADRAO)
    )
    return unsubscribe
  }, [])

  return metodos
}
