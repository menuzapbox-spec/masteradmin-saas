import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useCurrentStore } from '../storeContext'

const clean = value => String(value ?? '').trim()
const number = value => Number(value || 0)

function normalizeCategory(row) {
  return {
    id: row.id,
    title: clean(row.name || row.title || row.label) || 'Categoria',
    categoryId: row.id,
    imageUrl: clean(row.image_url || row.imageUrl || row.imagem),
    info: clean(row.description || row.info),
    type: clean(row.type),
    maxAddons: Math.max(1, number(row.max_addons || row.maxAddons || 1)),
    ordem: number(row.display_order ?? row.ordem ?? 0),
    active: row.active !== false && row.ativo !== false,
  }
}

function normalizeProduct(row, category, addonsByProduct) {
  const productAddons = (addonsByProduct.get(row.id) || []).map(addon => ({
    name: clean(addon.name || addon.label) || 'Adicional',
    price: number(addon.price),
    id: addon.id,
  }))

  return {
    id: row.id,
    name: clean(row.name || row.title) || 'Produto',
    price: number(row.price),
    description: clean(row.description),
    imageUrl: clean(row.image_url || row.imageUrl || row.imagem),
    category: category.title,
    categoryId: category.id,
    active: row.active !== false && row.ativo !== false,
    ordem: number(row.display_order ?? row.ordem ?? 0),
    addons: productAddons,
    maxAddons: Math.max(1, number(row.max_addons || row.maxAddons || productAddons.length || 1)),
  }
}

async function loadCatalog(storeId) {
  const [categoriesResult, productsResult, addonsResult] = await Promise.all([
    supabase.from('categories').select('*').eq('store_id', storeId),
    supabase.from('products').select('*').eq('store_id', storeId),
    supabase.from('addons').select('*').eq('store_id', storeId),
  ])

  if (categoriesResult.error) throw categoriesResult.error
  if (productsResult.error) throw productsResult.error
  if (addonsResult.error) throw addonsResult.error

  const categories = (categoriesResult.data || [])
    .map(normalizeCategory)
    .filter(category => category.active)
    .sort((a, b) => a.ordem - b.ordem || a.title.localeCompare(b.title))

  const addonsByProduct = new Map()
  ;(addonsResult.data || [])
    .filter(addon => addon.active !== false && addon.ativo !== false)
    .forEach(addon => {
      const key = addon.product_id || addon.productId
      if (!key) return
      if (!addonsByProduct.has(key)) addonsByProduct.set(key, [])
      addonsByProduct.get(key).push(addon)
    })

  const products = (productsResult.data || [])
    .filter(product => product.active !== false && product.ativo !== false)

  return categories.map(category => {
    const items = products
      .filter(product => String(product.category_id || product.categoryId || '') === String(category.id))
      .map(product => normalizeProduct(product, category, addonsByProduct))
      .sort((a, b) => a.ordem - b.ordem || a.name.localeCompare(b.name))

    return { ...category, items }
  }).filter(category => category.items.length > 0)
}

export function useCatalog() {
  const { store, loading: storeLoading } = useCurrentStore()
  const [sections, setSections] = useState([])

  useEffect(() => {
    let active = true
    let timer = null

    if (storeLoading || !store?.id) {
      setSections([])
      return undefined
    }

    const refresh = async () => {
      try {
        const next = await loadCatalog(store.id)
        if (active) setSections(next)
      } catch (error) {
        console.error('[catalog] Erro ao carregar catálogo:', error)
        if (active) setSections([])
      }
    }

    refresh()

    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 100)
    }

    const channel = supabase
      .channel(`catalog-${store.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `store_id=eq.${store.id}` }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${store.id}` }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'addons', filter: `store_id=eq.${store.id}` }, scheduleRefresh)
      .subscribe()

    return () => {
      active = false
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [store?.id, storeLoading])

  return sections
}
