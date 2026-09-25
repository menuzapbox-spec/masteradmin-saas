import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const FALLBACK_SLUG = import.meta.env.VITE_STORE_SLUG?.trim() || 'loja-demo'

function getSlugFromPath() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'loja' && parts[1]) return decodeURIComponent(parts[1])
  return FALLBACK_SLUG
}

export function useCurrentStore() {
  const [state, setState] = useState({ store: null, loading: true, error: null })
  const slug = getSlugFromPath()

  useEffect(() => {
    let active = true

    async function load() {
      setState({ store: null, loading: true, error: null })
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle()

      if (!active) return
      if (error) {
        setState({ store: null, loading: false, error })
        return
      }
      if (!data) {
        setState({ store: null, loading: false, error: new Error(`Loja \"${slug}\" não encontrada.`) })
        return
      }
      setState({ store: data, loading: false, error: null })
    }

    load()
    return () => { active = false }
  }, [slug])

  return { ...state, slug }
}

export function getCurrentStoreSlug() {
  return getSlugFromPath()
}
