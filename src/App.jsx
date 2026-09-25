import { useState } from 'react'
import { useCart } from './context/CartContext'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import ProductSection from './components/ProductSection'
import CartSidebar from './components/CartSidebar'
import CheckoutModal from './components/CheckoutModal'
import MobileCartBar from './components/MobileCartBar'
import QuestionsButton from './components/QuestionsButton'
import CustomerNotice from './components/CustomerNotice'
import { useCatalog } from './data/useCatalog'
import { useLandingSettings } from './data/useLandingSettings'
import { useStoreSettings } from './data/useStoreSettings'
import { useCurrentStore } from './storeContext'

export default function App() {
  const { store: currentStore, loading: storeLoading, error: storeError } = useCurrentStore()
  const sections = useCatalog()
  const landingSettings = useLandingSettings()
  const { DELIVERY_RADIUS_KM, FREE_DELIVERY_ENABLED, deliveryFee, STORE_OPEN, storeOpeningTime, storeClosingTime, storeScheduleEnabled } = useCart()
  const store = useStoreSettings()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grape-50 dark:bg-grape-950 px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-grape-200 border-t-grape-600" />
          <p className="font-semibold text-gray-700 dark:text-grape-100">Carregando loja...</p>
        </div>
      </div>
    )
  }

  if (storeError || !currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grape-50 dark:bg-grape-950 px-6">
        <div className="max-w-md rounded-2xl bg-white dark:bg-grape-900 p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loja não encontrada</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-grape-300">Verifique o endereço da loja e tente novamente.</p>
        </div>
      </div>
    )
  }

  if (currentStore.status === 'DISABLED' || currentStore.status === 'PAUSED') {
    const title = currentStore.status === 'DISABLED' ? 'Loja indisponível' : 'Loja temporariamente pausada'
    const message = currentStore.status === 'DISABLED'
      ? 'Esta loja não está disponível no momento.'
      : 'O atendimento desta loja está temporariamente pausado. Tente novamente mais tarde.'
    return (
      <div className="min-h-screen flex items-center justify-center bg-grape-50 dark:bg-grape-950 px-6">
        <div className="max-w-md rounded-2xl bg-white dark:bg-grape-900 p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-grape-300">{message}</p>
        </div>
      </div>
    )
  }

  const filteredSections = sections.filter(
    s => activeCategory === 'all' || s.categoryId === activeCategory
  )

  return (
    <div className="min-h-screen font-body bg-grape-50 dark:bg-grape-950 text-gray-900 dark:text-grape-100 white-label-theme" style={{'--wl-primary': store.primaryColor, '--wl-secondary': store.secondaryColor, '--wl-accent': store.accentColor, '--wl-add': store.addButtonColor, '--wl-cart': store.cartButtonColor, '--wl-notice': store.noticeColor, '--wl-notice-text': store.noticeTextColor }} >
      <CustomerNotice message={landingSettings?.customerNotice} enabled={landingSettings?.customerNoticeEnabled} />
      <Header />
      {storeScheduleEnabled && (
        <div className="mx-auto mt-3 max-w-6xl px-4">
          <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold shadow-sm ${STORE_OPEN ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            {STORE_OPEN ? `PEDIDOS ABERTOS • Hoje até ${storeClosingTime}` : `PEDIDOS FECHADOS • Horário: ${storeOpeningTime} às ${storeClosingTime}`}
          </div>
        </div>
      )}

      <div id="cardapio" className="lg:flex scroll-mt-3">
        <main className="flex-1 min-w-0 lg:mr-[360px]">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-28 lg:pb-10">
            <div className="pt-2 sm:pt-3 menu-99-search-area">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <div className="menu-99-content">
              <CategoryFilter
                active={activeCategory}
                onChange={setActiveCategory}
                sections={sections}
              />

              <div className="min-w-0 flex-1">
                {filteredSections.length === 0 && (
                  <p className="text-center text-gray-400 py-16">
                    Nenhum produto encontrado.
                  </p>
                )}
                {filteredSections.map(section => (
                  <ProductSection key={section.id} section={section} searchQuery={searchQuery} />
                ))}
              </div>
            </div>

            <footer className="text-center py-10 mt-8 border-t border-grape-200 dark:border-grape-800">
              <p className="font-display text-lg text-gray-600 dark:text-grape-300">
                {store.storeName} — {store.tagline}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {store.address || store.city || 'Endereço da loja não configurado'} {FREE_DELIVERY_ENABLED ? (DELIVERY_RADIUS_KM > 0 ? `• Frete grátis até ${DELIVERY_RADIUS_KM} km` : '• Frete grátis') : `• Frete R$ ${deliveryFee.toFixed(2)}`}
              </p>
              <p className="text-sm text-gray-400">WhatsApp: {store.whatsapp || store.phone || 'Não configurado'}</p>
              <p className="text-xs mt-3 text-gray-300 dark:text-grape-700">2026 - Todos os direitos reservados</p>
            </footer>
          </div>
        </main>

        <aside className="hidden lg:block fixed right-0 top-0 w-[360px] h-screen z-30">
          <CartSidebar onCheckout={() => setCheckoutOpen(true)} />
        </aside>
      </div>

      <MobileCartBar onClick={() => setMobileCartOpen(true)} />

      {mobileCartOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileCartOpen(false)}
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-grape-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute right-3 top-3 z-20">
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="Fechar carrinho"
                className="w-10 h-10 rounded-full bg-white/95 dark:bg-grape-800 border border-grape-200 dark:border-grape-700 shadow-lg text-gray-700 dark:text-grape-100 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <CartSidebar
              onCheckout={() => {
                setMobileCartOpen(false)
                setCheckoutOpen(true)
              }}
            />
          </div>
        </div>
      )}

      <QuestionsButton context="cardapio" />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </div>
  )
}
