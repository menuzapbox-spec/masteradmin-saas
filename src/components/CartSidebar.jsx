
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function CartSidebar({ onCheckout }) {
  const { cart, subtotal, deliveryFee, total, totalItems, updateQty, removeItem, MINIMUM_ORDER, isBelowMinimum, observation, setObservation, STORE_OPEN, storeOpeningTime, storeClosingTime, storeScheduleEnabled } = useCart()

  return (
    <aside className="flex flex-col h-screen bg-white dark:bg-grape-900 border-l border-grape-200 dark:border-grape-800">
      {/* header */}
      <div className="p-5 border-b border-grape-200 dark:border-grape-800">
        <h2 className="font-display text-xl flex items-center gap-2 text-gray-800 dark:text-grape-100">
          <ShoppingBag size={20} /> Seu Pedido
        </h2>
      </div>

      {/* items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <ShoppingBag size={40} strokeWidth={1} />
            <p className="text-sm">Seu carrinho está vazio.</p>
          </div>
        ) : (
          cart.map(item => {
            const price = Number(item.basePrice || 0)
            return (
              <div key={item.key} className="group flex gap-3 p-3 mb-2 rounded-xl bg-grape-50/70 dark:bg-grape-800/40 border border-grape-100 dark:border-grape-800">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-grape-700 to-teal-500 text-white flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{item.category}</span>
                  <p className="text-sm font-bold text-gray-800 dark:text-grape-100 leading-tight">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">R$ {price.toFixed(2)} cada</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQty(item.key, -1)} aria-label="Diminuir quantidade" className="w-9 h-9 rounded-full border border-grape-200 dark:border-grape-700 bg-white dark:bg-grape-900 flex items-center justify-center hover:bg-grape-100"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, 1)} aria-label="Aumentar quantidade" className="w-9 h-9 rounded-full border border-grape-200 dark:border-grape-700 bg-white dark:bg-grape-900 flex items-center justify-center hover:bg-grape-100"><Plus size={14} /></button>
                    <button onClick={() => removeItem(item.key)} aria-label="Remover produto" className="ml-auto w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* totals + checkout */}
      {cart.length > 0 && (
        <div className="p-5 border-t border-grape-200 dark:border-grape-800 space-y-2">
          <div className="flex justify-between text-sm text-gray-500 dark:text-grape-400">
            <span>Subtotal ({totalItems} itens)</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 dark:text-grape-400">
            <span>Entrega</span>
            <span className="font-semibold text-green-600 dark:text-green-400">Grátis</span>
          </div>
          <div className="flex justify-between font-display text-xl text-grape-700 dark:text-grape-300 pt-2 border-t border-grape-200 dark:border-grape-700">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="rounded-xl border-2 border-grape-200 dark:border-grape-700 bg-grape-50/70 dark:bg-grape-800/40 p-3 mb-2">
            <label htmlFor="cart-observation" className="block text-sm font-bold text-gray-700 dark:text-grape-200 mb-2">Observação do pedido</label>
            <textarea
              id="cart-observation"
              value={observation}
              onChange={e => setObservation(e.target.value.slice(0, 500))}
              placeholder="Ex.: pouco açúcar, tocar a campainha, retirar algum ingrediente..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-grape-200 dark:border-grape-600 bg-white dark:bg-grape-900 px-3 py-2 text-sm focus:outline-none focus:border-grape-500"
            />
            <div className="text-[10px] text-gray-400 text-right mt-1">{observation.length}/500</div>
          </div>

          <div className={`rounded-xl p-3 ${isBelowMinimum ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className={isBelowMinimum ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}>
                {isBelowMinimum ? `Faltam R$ ${(MINIMUM_ORDER - subtotal).toFixed(2)}` : '✓ Pedido mínimo atingido'}
              </span>
              <span className="text-gray-500">R$ {MINIMUM_ORDER.toFixed(2)}</span>
            </div>
            <div className="h-2 rounded-full bg-black/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isBelowMinimum ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, (subtotal / MINIMUM_ORDER) * 100)}%`}} />
            </div>
          </div>
          <div className="cart-whatsapp-required rounded-xl border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3 mt-3">
            <p className="text-xs font-extrabold text-green-900 dark:text-green-200">Envio pelo WhatsApp é obrigatório para finalizar</p>
            <p className="mt-1 text-[11px] leading-relaxed text-green-800 dark:text-green-300">Na próxima etapa, confirme o aviso e o WhatsApp será aberto com seu pedido preenchido.</p>
          </div>
          <button
            onClick={onCheckout}
            disabled={isBelowMinimum || !STORE_OPEN}
            className="cart-checkout-whatsapp btn-3d w-full mt-3 rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {!STORE_OPEN && storeScheduleEnabled ? `Pedidos fechados • ${storeOpeningTime} às ${storeClosingTime}` : isBelowMinimum ? `Pedido mínimo de R$ ${MINIMUM_ORDER.toFixed(2)}` : 'Continuar para o WhatsApp'}
          </button>
        </div>
      )}
    </aside>
  )
}
