import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES as LABELS_PADRAO } from '../data/products'

export default function CategoryFilter({ active, onChange, sections = [] }) {
  const [open, setOpen] = useState(false)
  const idsConhecidos = new Set(LABELS_PADRAO.map(c => c.id))
  const extras = sections
    .filter(s => !idsConhecidos.has(s.categoryId))
    .map(s => ({ id: s.categoryId, label: s.title }))
  const categories = [...LABELS_PADRAO, ...extras]

  const choose = id => {
    onChange(id)
    setOpen(false)
    requestAnimationFrame(() => {
      if (id !== 'all') document.getElementById(`categoria-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <>
      <div className="menu-99-categories-slot">
        <div className="menu-99-categories-sticky">
        <div className="menu-99-categories-row">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir todas as categorias"
            className="menu-99-menu-button"
          >
            <Menu size={20} />
          </button>
          <div className="menu-99-category-scroll" aria-label="Categorias do cardápio">
            {categories.map(cat => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => choose(cat.id)}
                aria-current={active === cat.id ? 'page' : undefined}
                className={`menu-99-chip ${active === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>
        </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Fechar categorias" />
          <div className="menu-99-category-drawer">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cardápio</p>
                <h2 className="font-display text-2xl text-grape-800 dark:text-grape-100">Categorias</h2>
              </div>
              <button onClick={() => setOpen(false)} className="w-11 h-11 rounded-full bg-grape-100 dark:bg-grape-800 flex items-center justify-center" aria-label="Fechar">
                <X size={22} />
              </button>
            </div>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => choose(cat.id)}
                  className={`menu-99-drawer-item ${active === cat.id ? 'active' : ''}`}
                >
                  <span>{cat.label}</span>
                  <span>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
