import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="menu-99-search-wrap">
      <div className="menu-99-search">
        <Search size={20} />
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Pesquisar itens na loja"
          aria-label="Pesquisar itens na loja"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} aria-label="Limpar busca">
            <X size={17} />
          </button>
        )}
      </div>
    </div>
  )
}
