import { useState } from 'react'

const PADRAO = { pix: true, debito: true, credito: true, dinheiro: true }

// Phase 6: o checkout não consulta mais tabelas legadas.
// A gestão específica de meios de pagamento será ligada ao novo modelo
// multi-loja em uma fase própria, sem quebrar o checkout atual.
export function usePaymentMethods() {
  const [metodos] = useState(PADRAO)
  return metodos
}
