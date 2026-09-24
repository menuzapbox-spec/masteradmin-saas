import { useEffect, useState } from 'react'
import { db, doc, onSnapshot } from '../supabase'

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

export function useStoreSettings() {
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'configuracoes', 'loja'),
      snap => {
        const d = snap.exists() ? snap.data() : {}
        setSettings({
          storeName: clean(d.storeName) || DEFAULT_STORE_SETTINGS.storeName,
          tagline: clean(d.tagline) || DEFAULT_STORE_SETTINGS.tagline,
          subtitle: clean(d.subtitle) || DEFAULT_STORE_SETTINGS.subtitle,
          phone: clean(d.phone),
          whatsapp: clean(d.whatsapp),
          address: clean(d.address),
          city: clean(d.city),
          logoUrl: clean(d.logoUrl),
          primaryColor: validColor(d.primaryColor, DEFAULT_STORE_SETTINGS.primaryColor),
          secondaryColor: validColor(d.secondaryColor, DEFAULT_STORE_SETTINGS.secondaryColor),
          accentColor: validColor(d.accentColor, DEFAULT_STORE_SETTINGS.accentColor),
          addButtonColor: validColor(d.addButtonColor, DEFAULT_STORE_SETTINGS.addButtonColor),
          cartButtonColor: validColor(d.cartButtonColor, DEFAULT_STORE_SETTINGS.cartButtonColor),
          noticeColor: validColor(d.noticeColor, DEFAULT_STORE_SETTINGS.noticeColor),
          noticeTextColor: validColor(d.noticeTextColor, DEFAULT_STORE_SETTINGS.noticeTextColor),
        })
      },
      () => setSettings(DEFAULT_STORE_SETTINGS)
    )
    return unsubscribe
  }, [])
  return settings
}
