import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuração do Supabase ausente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Render.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

export const db = supabase

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const isPlainDoc = ref => ref?.kind === 'doc'
const isCollection = ref => ref?.kind === 'collection'

export function collection(_db, table) { return { kind: 'collection', table } }
export function doc(_db, table, id) { return { kind: 'doc', table, id } }
export function query(ref, ...constraints) { return { ...ref, constraints } }
export function orderBy(field, direction = 'asc') { return { type: 'orderBy', field, direction } }

function unwrap(row, table) {
  if (!row) return null
  if (table === 'admins') return { id: row.id, ...row }
  return { id: row.id, ...(row.data || {}) }
}

function makeSnapshot(rows, table, single = false) {
  if (single) {
    const row = rows?.[0] || null
    return {
      exists: () => !!row,
      data: () => unwrap(row, table),
      id: row?.id,
    }
  }
  const docs = (rows || []).map(row => ({ id: row.id, data: () => unwrap(row, table) }))
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
  }
}

function sortedRows(rows, constraints = []) {
  const sort = constraints.find(c => c?.type === 'orderBy')
  if (!sort) return rows
  const getValue = row => {
    const value = row?.data?.[sort.field]
    return value ?? row?.[sort.field]
  }
  return [...rows].sort((a, b) => {
    const av = getValue(a); const bv = getValue(b)
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sort.direction === 'desc' ? -cmp : cmp
  })
}

async function readRows(ref) {
  const { table, constraints = [] } = ref
  let req = supabase.from(table).select('*')
  if (isPlainDoc(ref)) req = req.eq('id', ref.id).limit(1)
  const { data, error } = await req
  if (error) throw error
  return sortedRows(data || [], constraints)
}

export async function getDoc(ref) {
  const rows = await readRows(ref)
  return makeSnapshot(rows, ref.table, true)
}

export async function setDoc(ref, payload, options = {}) {
  if (!isPlainDoc(ref)) throw new Error('setDoc requer um documento.')
  if (ref.table === 'admins') {
    const row = { id: ref.id, ...payload }
    const { error } = await supabase.from(ref.table).upsert(row, { onConflict: 'id' })
    if (error) throw error
    return
  }
  if (options.merge) {
    const current = await getDoc(ref)
    const merged = { ...(current.data() || {}), ...payload }
    const { error } = await supabase.from(ref.table).upsert({ id: ref.id, data: merged }, { onConflict: 'id' })
    if (error) throw error
    return
  }
  const { error } = await supabase.from(ref.table).upsert({ id: ref.id, data: payload }, { onConflict: 'id' })
  if (error) throw error
}

export async function updateDoc(ref, payload) {
  const current = await getDoc(ref)
  if (!current.exists()) throw new Error('Documento não encontrado.')
  const merged = { ...(current.data() || {}), ...payload }
  if (ref.table === 'admins') {
    const { error } = await supabase.from(ref.table).update(merged).eq('id', ref.id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from(ref.table).update({ data: merged }).eq('id', ref.id)
  if (error) throw error
}

export async function deleteDoc(ref) {
  const { error } = await supabase.from(ref.table).delete().eq('id', ref.id)
  if (error) throw error
}

export async function addDoc(ref, payload) {
  if (!isCollection(ref)) throw new Error('addDoc requer uma coleção.')
  const { data, error } = await supabase.from(ref.table).insert({ data: payload }).select('id').single()
  if (error) throw error
  return { id: data.id, ...ref }
}

export function onSnapshot(ref, onNext, onError) {
  let active = true
  const channelName = `wl-${ref.table}-${Math.random().toString(36).slice(2)}`

  const refresh = async () => {
    try {
      const rows = await readRows(ref)
      if (active) onNext(makeSnapshot(rows, ref.table, isPlainDoc(ref)))
    } catch (err) {
      if (active && onError) onError(err)
    }
  }

  refresh()

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: ref.table }, refresh)
    .subscribe()

  return () => {
    active = false
    supabase.removeChannel(channel)
  }
}

export async function uploadImage(file, folder = 'geral') {
  if (!file) return ''
  if (!file.type.startsWith('image/')) throw new Error('Selecione uma imagem válida.')
  if (file.size > 4 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 4 MB.')
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `cardapio/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
  const { error } = await supabase.storage.from('cardapio').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('cardapio').getPublicUrl(path)
  return data.publicUrl
}

export function getAuth() { return supabase.auth }
export const onAuthStateChanged = (auth, callback) => {
  supabase.auth.getSession().then(({ data }) => callback(data.session?.user || null, 'INITIAL_SESSION'))
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session?.user || null, event))
  return () => data.subscription.unsubscribe()
}
export async function signInWithEmailAndPassword(_auth, email, password) {
  const result = await supabase.auth.signInWithPassword({ email, password })
  if (result.error) throw result.error
  return result.data.user
}
export async function sendPasswordResetEmail(_auth, email) {
  // O Admin e o cardápio são serviços Render separados. Nunca dependa apenas
  // da Site URL do Supabase para o reset: o link precisa voltar explicitamente
  // para o endereço público do Admin.
  // Em produção, o Admin deste projeto está publicado neste endereço.
  // VITE_ADMIN_URL continua tendo prioridade caso o domínio seja alterado.
  const configuredAdminUrl = import.meta.env.VITE_ADMIN_URL?.trim()
  const baseUrl = configuredAdminUrl || window.location.origin
  const redirectUrl = new URL('/admin-1.html', baseUrl)
  redirectUrl.hash = ''
  redirectUrl.search = ''
  const redirectTo = redirectUrl.toString()

  const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (result.error) throw result.error
}
export async function signOut(_auth) {
  const result = await supabase.auth.signOut()
  if (result.error) throw result.error
}

export async function updatePassword(_auth, password) {
  const result = await supabase.auth.updateUser({ password })
  if (result.error) throw result.error
}

// --- Multi-tenant helpers (novo SaaS) ---
export async function getStoreBySlug(slug) {
  const cleanSlug = String(slug || '').trim()
  if (!cleanSlug) return null
  const { data, error } = await supabase.from('stores').select('*').eq('slug', cleanSlug).limit(1).maybeSingle()
  if (error) throw error
  return data || null
}

export async function getCurrentUserProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const user = sessionData.session?.user
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data || null
}
