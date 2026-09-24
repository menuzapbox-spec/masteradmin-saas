import { useEffect, useState } from 'react'
import { db, collection, onSnapshot, query, orderBy } from '../supabase'
import { sections as sectionsPadrao } from './products'

// Lê a coleção "catalogo" no Supabase PostgreSQL (gerenciada pelo admin) em tempo real.
// Cada documento da coleção é uma seção do cardápio (mesmo formato usado em
// src/data/products.js: id, title, categoryId, type, items, addons, sizes...).
// Enquanto o admin não importar/editar nada no Supabase, a coleção fica vazia
// e a loja continua usando o catálogo padrão embutido no código, então nada
// muda para quem já está usando o site hoje.
export function useCatalog() {
  const [sections, setSections] = useState(sectionsPadrao)

  useEffect(() => {
    const q = query(collection(db, 'catalogo'), orderBy('ordem', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        if (snapshot.empty) {
          setSections(sectionsPadrao)
          return
        }
        const dinamico = snapshot.docs.map(d => {
          const data = d.data()
          if (data.type === 'size-select') {
            return { id: d.id, ...data, imageUrl: data.imageUrl || data.imagem || '', sizes: (data.sizes || []).filter(s => s.ativo !== false) }
          }
          return { id: d.id, ...data, imageUrl: data.imageUrl || data.imagem || '', items: (data.items || []).filter(i => i.ativo !== false) }
        })
        setSections(dinamico)
      },
      () => {
        // Sem conexão/permissão: mantém o catálogo padrão, o site não quebra.
        setSections(sectionsPadrao)
      }
    )
    return unsubscribe
  }, [])

  return sections
}
