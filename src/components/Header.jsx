import { Sun, Moon, MapPin, Phone } from 'lucide-react'
import { useCart } from '../context/CartContext'
import useTheme from '../hooks/useTheme'
import { useStoreSettings } from '../data/useStoreSettings'

export default function Header() {
  const [dark, setDark] = useTheme()
  const { DELIVERY_RADIUS_KM, FREE_DELIVERY_ENABLED, deliveryFee, STORE_OPEN, storeOpeningTime, storeClosingTime, storeScheduleEnabled } = useCart()
  const store = useStoreSettings()
  const initials = store.storeName.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'LO'

  return (
    <header className="menu-99-header">
      <div className="menu-99-header-inner">
        <div className="menu-99-brand">
          <div className="menu-99-brand-logo">{store.logoUrl ? <img src={store.logoUrl} alt={store.storeName} /> : <span>{initials}</span>}</div>
          <div className="min-w-0">
            <strong>{store.storeName}</strong>
            <span>{(store.address || store.city) ? <><MapPin size={12} /> {store.address || store.city}</> : <>{store.tagline}</>}</span>
          </div>
        </div>
        <div className="menu-99-status">
          {storeScheduleEnabled && (
            <span className={STORE_OPEN ? 'is-open' : 'is-closed'}>
              {STORE_OPEN ? `Aberto até ${storeClosingTime}` : `Abre às ${storeOpeningTime}`}
            </span>
          )}
          <span>{FREE_DELIVERY_ENABLED ? (DELIVERY_RADIUS_KM > 0 ? `Frete grátis até ${DELIVERY_RADIUS_KM} km` : 'Frete grátis') : `Frete: R$ ${deliveryFee.toFixed(2)}`}</span>
        </div>
        <div className="menu-99-actions">
          {store.phone && <a href={`tel:${store.phone.replace(/\D/g, '')}`} aria-label="Ligar para a loja"><Phone size={18} /></a>}
          <button onClick={() => setDark(!dark)} aria-label="Alternar tema">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  )
}
