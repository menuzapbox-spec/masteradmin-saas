import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useCurrentStore } from '../storeContext'

const PADRAO = { pix: true, debito: true, credito: true, dinheiro: true }

export function usePaymentMethods() {
  const { store, loading } = useCurrentStore()
  const [metodos, setMetodos] = useState(PADRAO)

  useEffect(() => {
    let active = true
    async function load() {
      if (loading || !store?.id) return
      const { data, error } = await supabase
        .from('store_settings')
        .select('payment_methods')
        .eq('store_id', store.id)
        .limit(1)
        .maybeSingle()
      if (!active) return
      if (error || !data?.payment_methods) {
        setMetodos(PADRAO)
        return
      }
      setMetodos({ ...PADRAO, ...data.payment_methods })
    }
    load()
    return () => { active = false }
  }, [store?.id, loading])

  return metodos
}
