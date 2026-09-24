import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'

const money = value => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`

export function SimpleCard({ item, index }) {
  const { addItem, updateQty, cart } = useCart()
  const delay = Math.min(index * 0.025, 0.35)
  const productKey = `${item.name}-${item.category}`
  const quantity = cart.reduce((sum, cartItem) => sum + (cartItem.productKey === productKey || (!cartItem.productKey && cartItem.key === productKey) ? Number(cartItem.qty || 0) : 0), 0)

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="menu-99-product"
    >
      <div className="menu-99-product-info">
        <p className="menu-99-product-name">{item.name}</p>
        <p className="menu-99-product-price">{money(item.price)}</p>
        <div className="menu-99-add-row">
          {quantity > 0 && (
            <button
              type="button"
              className="menu-99-qty-btn"
              aria-label={`Diminuir ${item.name}`}
              onClick={() => {
                const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && i.key === productKey))
                if (target) updateQty(target.key, -1)
              }}
            >−</button>
          )}
          <button
            type="button"
            onClick={() => addItem({ key: productKey, productKey, name: item.name, basePrice: item.price, category: item.category, imageUrl: item.imageUrl || '' })}
            className="menu-99-add menu-99-add-strong"
          >
            <Plus size={15} strokeWidth={2.5} /> <span>Adicionar</span>{quantity > 0 && <span className="menu-99-add-count">{quantity}</span>}
          </button>
          {quantity > 0 && (
            <button
              type="button"
              className="menu-99-qty-btn"
              aria-label={`Aumentar ${item.name}`}
              onClick={() => {
                const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && i.key === productKey))
                if (target) updateQty(target.key, 1)
              }}
            >+</button>
          )}
        </div>
      </div>
      <div className="menu-99-product-image">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <span aria-hidden="true" />}
      </div>
    </motion.article>
  )
}

export function AddonCard({ item, addons = [], index }) {
  const { addItem, updateQty, cart } = useCart()
  const [selected, setSelected] = useState([])
  const delay = Math.min(index * 0.025, 0.35)
  const productKey = `${item.name}-${item.category}`
  const quantity = cart.reduce((sum, cartItem) => sum + (cartItem.productKey === productKey ? Number(cartItem.qty || 0) : (!cartItem.productKey && String(cartItem.key || '').startsWith(item.name) ? Number(cartItem.qty || 0) : 0)), 0)

  const normalizedAddons = (addons || []).map((addon, i) =>
    typeof addon === 'string'
      ? { name: addon, price: 0, key: `${addon}-${i}` }
      : { ...addon, name: addon.name || addon.label || `Adicional ${i + 1}`, price: Number(addon.price || 0), key: `${addon.name || addon.label || i}-${i}` }
  )
  const maxAddons = Math.max(1, Number(item.maxAddons || normalizedAddons.length || 1))
  const addonTotal = selected.reduce((sum, name) => sum + Number(normalizedAddons.find(a => a.name === name)?.price || 0), 0)
  const finalPrice = Number(item.price || 0) + addonTotal

  const toggleAddon = addonName => {
    setSelected(prev => {
      if (prev.includes(addonName)) return prev.filter(a => a !== addonName)
      if (prev.length >= maxAddons) return prev
      return [...prev, addonName]
    })
  }

  const handleAdd = () => {
    if (normalizedAddons.length > 0 && selected.length === 0) {
      alert('Selecione pelo menos 1 adicional antes de adicionar o produto ao carrinho.')
      return
    }
    const addonDetails = selected.map(name => {
      const a = normalizedAddons.find(x => x.name === name)
      return { name, price: Number(a?.price || 0) }
    })
    const addonText = addonDetails.length
      ? ` + [${addonDetails.map(a => a.price > 0 ? `${a.name} (+R$ ${a.price.toFixed(2).replace('.', ',')})` : a.name).join(', ')}]`
      : ''
    addItem({
      key: `${item.name}${addonText}`,
      productId: item.id || null,
      productKey,
      name: `${item.name}${addonText}`,
      basePrice: finalPrice,
      category: item.category,
      imageUrl: item.imageUrl || '',
      addonDetails,
    })
    setSelected([])
  }

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.25 }} className="menu-99-product menu-99-product-addon">
      <div className="menu-99-product-info">
        <p className="menu-99-product-name">{item.name}</p>
        <p className="menu-99-product-price">{money(finalPrice)}</p>
        <div className="menu-99-addons">
          <p>Escolha até {maxAddons} adicional(is)</p>
          {normalizedAddons.map(addon => (
            <label key={addon.key}>
              <input type="checkbox" checked={selected.includes(addon.name)} onChange={() => toggleAddon(addon.name)} />
              <span>{addon.name}{addon.price > 0 ? ` (+R$ ${addon.price.toFixed(2).replace('.', ',')})` : ''}</span>
            </label>
          ))}
        </div>
        <div className="menu-99-add-row">
          {quantity > 0 && (
            <button
              type="button"
              className="menu-99-qty-btn"
              aria-label={`Diminuir ${item.name}`}
              onClick={() => {
                const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && String(i.key || '').startsWith(item.name)))
                if (target) updateQty(target.key, -1)
              }}
            >−</button>
          )}
          <button type="button" onClick={handleAdd} className="menu-99-add menu-99-add-strong">
            <Plus size={15} strokeWidth={2.5} /> <span>Adicionar</span>{quantity > 0 && <span className="menu-99-add-count">{quantity}</span>}
          </button>
          {quantity > 0 && (
            <button
              type="button"
              className="menu-99-qty-btn"
              aria-label={`Aumentar ${item.name}`}
              onClick={() => {
                const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && String(i.key || '').startsWith(item.name)))
                if (target) updateQty(target.key, 1)
              }}
            >+</button>
          )}
        </div>
      </div>
      <div className="menu-99-product-image">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <span aria-hidden="true" />}
      </div>
    </motion.article>
  )
}

export function SizeSelectCard({ name, category, sizes, index, imageUrl }) {
  const { addItem, updateQty, cart } = useCart()
  const delay = Math.min(index * 0.04, 0.35)

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.25 }} className="menu-99-size-card">
      <div className="menu-99-size-head">
        <div><p>{name}</p><span>Escolha o tamanho</span></div>
        {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
      </div>
      <div className="menu-99-size-options">
          {sizes.map(option => {
            const productKey = `${name} (${option.value})`
            const quantity = cart.reduce((sum, cartItem) => sum + (cartItem.productKey === productKey || (!cartItem.productKey && cartItem.key === productKey) ? Number(cartItem.qty || 0) : 0), 0)
            return (
              <div key={option.value} className="menu-99-size-option-row">
                <button type="button" className="menu-99-size-main" onClick={() => addItem({ key: productKey, productKey, name: productKey, basePrice: option.price, category, imageUrl: imageUrl || '' })}>
                  <span>{option.label}{quantity > 0 && <b className="menu-99-option-count">{quantity}</b>}</span><strong>{money(option.price)}</strong><Plus size={16} />
                </button>
                {quantity > 0 && (
                  <div className="menu-99-size-qty">
                    <button type="button" className="menu-99-qty-btn" aria-label={`Diminuir ${name} ${option.label}`} onClick={() => {
                      const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && i.key === productKey))
                      if (target) updateQty(target.key, -1)
                    }}>−</button>
                    <span>{quantity}</span>
                    <button type="button" className="menu-99-qty-btn" aria-label={`Aumentar ${name} ${option.label}`} onClick={() => {
                      const target = [...cart].reverse().find(i => i.productKey === productKey || (!i.productKey && i.key === productKey))
                      if (target) updateQty(target.key, 1)
                    }}>+</button>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </motion.article>
  )
}
