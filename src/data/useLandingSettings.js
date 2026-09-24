import { useEffect, useState } from 'react'
import { db, doc, onSnapshot } from '../supabase'

const DEFAULT = { featuredCategoryIds: [], featuredProductKeys: [], customerNotice: '', customerNoticeEnabled: false }

export function useLandingSettings() {
  const [settings, setSettings] = useState(DEFAULT)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'configuracoes', 'loja'),
      snap => {
        const data = snap.exists() ? snap.data() : {}
        setSettings({
          featuredCategoryIds: Array.isArray(data.featuredCategoryIds) ? data.featuredCategoryIds.map(String) : [],
          featuredProductKeys: Array.isArray(data.featuredProductKeys) ? data.featuredProductKeys.map(String) : [],
          customerNotice: String(data.customerNotice || '').trim().slice(0, 500),
          customerNoticeEnabled: data.customerNoticeEnabled === true,
        })
      },
      () => setSettings(DEFAULT)
    )
    return unsubscribe
  }, [])

  return settings
}
