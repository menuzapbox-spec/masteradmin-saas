import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useCurrentStore } from '../storeContext'

export const DEFAULT_STORE_SETTINGS = {
  storeName: 'Minha Loja',
  tagline: 'Seu cardápio digital',
  subtitle: 'Escolha seus produtos, monte o carrinho e faça seu pedido.',
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  logoUrl: '',
  primaryColor: '#5B21B6',
  secondaryColor: '#EC4899',
  accentColor: '#F6EEB4',
  addButtonColor: '#10B981',
  cartButtonColor: '#EC4899',
  noticeColor: '#EDE9FE',
  noticeTextColor: '#4C1D95',
}

const clean = value => String(value ?? '').trim()
const validColor = (value, fallback) => /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback

function normalizeStore(store, extra = {}) {
  const d = { ...store, ...extra }
  return {
    storeId: store?.id || '',
    slug: clean(store?.slug),
    status: clean(store?.status),
    operationStatus: clean(store?.operation_status || store?.operationStatus),
    storeName: clean(d.store_name || d.storeName || store?.name) || DEFAULT_STORE_SETTINGS.storeName,
    tagline: clean(d.tagline) || DEFAULT_STORE_SETTINGS.tagline,
    subtitle: clean(d.subtitle) || DEFAULT_STORE_SETTINGS.subtitle,
    phone: clean(d.phone),
    whatsapp: clean(d.whatsapp),
    address: clean(d.address),
    city: clean(d.city),
    logoUrl: clean(d.logo_url || d.logoUrl),
    primaryColor: validColor(d.primary_color || d.primaryColor, DEFAULT_STORE_SETTINGS.primaryColor),
    secondaryColor: validColor(d.secondary_color || d.secondaryColor, DEFAULT_STORE_SETTINGS.secondaryColor),
    accentColor: validColor(d.accent_color || d.accentColor, DEFAULT_STORE_SETTINGS.accentColor),
    addButtonColor: validColor(d.add_button_color || d.addButtonColor, DEFAULT_STORE_SETTINGS.addButtonColor),
    cartButtonColor: validColor(d.cart_button_color || d.cartButtonColor, DEFAULT_STORE_SETTINGS.cartButtonColor),
    noticeColor: validColor(d.notice_color || d.noticeColor, DEFAULT_STORE_SETTINGS.noticeColor),
    noticeTextColor: validColor(d.notice_text_color || d.noticeTextColor, DEFAULT_STORE_SETTINGS.noticeTextColor),
  }
}

export function useStoreSettings() {
  const { store, loading: storeLoading } = useCurrentStore()
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      if (storeLoading) return
      if (!store) {
        if (active) {
          setSettings(DEFAULT_STORE_SETTINGS)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      let extra = {}
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .limit(1)
        .maybeSingle()

      // A store may legitimately have no settings row yet. The storefront
      // can still use the values stored directly on stores.
      if (!error && data) extra = data

      if (active) {
        setSettings(normalizeStore(store, extra))
        setLoading(false)
      }
    }

    load().catch(() => {
      if (active) {
        setSettings(store ? normalizeStore(store) : DEFAULT_STORE_SETTINGS)
        setLoading(false)
      }
    })

    return () => { active = false }
  }, [store, storeLoading])

  return { ...settings, loading }
}
