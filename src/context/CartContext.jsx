import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { db, doc, getDoc } from '../supabase'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('store_cart')) || []
    } catch {
      return []
    }
  })

  const [deliveryType, setDeliveryType] = useState('entrega')
  const [observation, setObservation] = useState(() => localStorage.getItem('store_observation') || '')
  const [MINIMUM_ORDER, setMinimumOrder] = useState(0.0)
  const [storeConfig, setStoreConfig] = useState({ freeDeliveryKm: 0, pixKey: '', pixBeneficiary: '', freeDeliveryEnabled: false, openingTime: '10:00', closingTime: '22:00', storeScheduleEnabled: false })
  const [, setClockTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setClockTick(v => v + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    getDoc(doc(db, 'configuracoes', 'loja')).then(snap => {
      if (active && snap.exists()) {
        const data = snap.data()
        if (Number(data.minimumOrder) >= 0) setMinimumOrder(Number(data.minimumOrder))
        const freeDeliveryKm = Number(data.freeDeliveryKm)
        const pixKey = String(data.pixKey || '').trim()
        const pixBeneficiary = String(data.pixBeneficiary || '').trim()
        setStoreConfig({
          freeDeliveryKm: Number.isFinite(freeDeliveryKm) && freeDeliveryKm > 0 ? freeDeliveryKm : 0,
          pixKey, 
          pixBeneficiary,
          freeDeliveryEnabled: data.freeDeliveryEnabled === true,
          openingTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.openingTime || '')) ? String(data.openingTime) : '10:00',
          closingTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.closingTime || '')) ? String(data.closingTime) : '22:00',
          storeScheduleEnabled: data.storeScheduleEnabled === true,
        })
      }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    localStorage.setItem('store_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('store_observation', observation)
  }, [observation])

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        return sum + Number(item.basePrice || 0) * item.qty
      }, 0),
    [cart]
  )

  const DELIVERY_RADIUS_KM = storeConfig.freeDeliveryKm
  const FREE_DELIVERY_ENABLED = storeConfig.freeDeliveryEnabled !== false

  const isWithinStoreHours = useMemo(() => {
    if (!storeConfig.storeScheduleEnabled) return true
    const now = new Date()
    const current = now.getHours() * 60 + now.getMinutes()
    const [oh, om] = storeConfig.openingTime.split(':').map(Number)
    const [ch, cm] = storeConfig.closingTime.split(':').map(Number)
    const open = oh * 60 + om
    const close = ch * 60 + cm
    if (open === close) return true
    if (open < close) return current >= open && current < close
    return current >= open || current < close
  }, [storeConfig.openingTime, storeConfig.closingTime, storeConfig.storeScheduleEnabled])

  const STORE_OPEN = isWithinStoreHours

  const deliveryFee = 0
  const total = subtotal + deliveryFee
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const isBelowMinimum = cart.length > 0 && subtotal < MINIMUM_ORDER

  function addItem(item) {
    setCart(prev => {
      const existing = prev.find(i => i.key === item.key)
      if (existing) {
        return prev.map(i => (i.key === item.key ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function updateQty(key, delta) {
    setCart(prev =>
      prev.map(i => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter(i => i.qty > 0)
    )
  }

  function removeItem(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  function clearCart() {
    setCart([])
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        deliveryType,
        setDeliveryType,
        observation,
        setObservation,
        pixKey: storeConfig.pixKey,
        pixBeneficiary: storeConfig.pixBeneficiary,
        FREE_DELIVERY_ENABLED,
        STORE_OPEN,
        storeOpeningTime: storeConfig.openingTime,
        storeClosingTime: storeConfig.closingTime,
        storeScheduleEnabled: storeConfig.storeScheduleEnabled,
        subtotal,
        deliveryFee,
        total,
        totalItems,
        MINIMUM_ORDER,
        DELIVERY_RADIUS_KM,
        isBelowMinimum,
        addItem,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
