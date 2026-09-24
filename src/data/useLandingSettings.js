import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useCurrentStore } from '../storeContext'

const DEFAULT = { featuredCategoryIds: [], featuredProductKeys: [], customerNotice: '', customerNoticeEnabled: false }

export function useLandingSettings() {
  const { store, loading } = useCurrentStore()
  const [settings, setSettings] = useState(DEFAULT)

  useEffect(() => {
    let active = true
    if (loading || !store?.id) {
      setSettings(DEFAULT)
      return () => { active = false }
    }

    async function load() {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', store.id)
        .limit(1)
        .maybeSingle()

      if (!active) return
      if (error || !data) {
        setSettings(DEFAULT)
        return
      }

      setSettings({
        featuredCategoryIds: Array.isArray(data.featured_category_ids) ? data.featured_category_ids.map(String) : [],
        featuredProductKeys: Array.isArray(data.featured_product_keys) ? data.featured_product_keys.map(String) : [],
        customerNotice: String(data.customer_notice ?? data.customerNotice ?? '').trim().slice(0, 500),
        customerNoticeEnabled: (data.customer_notice_enabled ?? data.customerNoticeEnabled) === true,
      })
    }

    load().catch(() => { if (active) setSettings(DEFAULT) })
    return () => { active = false }
  }, [store?.id, loading])

  return settings
}
