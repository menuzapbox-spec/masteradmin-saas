import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCurrentStore } from '../storeContext'
import { createStoreOrder } from '../services/orderService'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { useStoreSettings } from '../data/useStoreSettings'


export default function CheckoutModal({ isOpen, onClose }) {
  const {
    cart,
    subtotal,
    deliveryFee,
    total,
    totalItems,
    deliveryType,
    updateQty,
    clearCart,
    MINIMUM_ORDER,
    isBelowMinimum,
    observation,
    setObservation,
    DELIVERY_RADIUS_KM,
    pixKey,
    pixBeneficiary,
    FREE_DELIVERY_ENABLED,
  } = useCart()

  const metodosHabilitados = usePaymentMethods()
  const store = useStoreSettings()
  const { store: currentStore } = useCurrentStore()
  const whatsapp = String(store.whatsapp || store.phone || '').replace(/\D/g, '')

  const [name, setName] = useState(() => localStorage.getItem('store_name') || '')
  const [address, setAddress] = useState(() => localStorage.getItem('store_address') || '')
  const [reference, setReference] = useState(() => localStorage.getItem('store_ref') || '')
  const [sending, setSending] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [needsChange, setNeedsChange] = useState('')
  const [changeFor, setChangeFor] = useState('')
  const [whatsappAcknowledged, setWhatsappAcknowledged] = useState(false)

  const changeAmount = (() => {
    const val = parseFloat(changeFor)
    if (!isNaN(val) && val > total) return (val - total).toFixed(2)
    return null
  })()

  const handleSubmit = async e => {
    e.preventDefault()
    if (cart.length === 0) return
    if (isBelowMinimum) {
      alert(`O pedido mínimo é de R$ ${MINIMUM_ORDER.toFixed(2)}. Adicione mais itens para continuar.`)
      return
    }
    if (!paymentMethod) {
      alert('Por favor, selecione a forma de pagamento.')
      return
    }
    if (paymentMethod === 'dinheiro' && needsChange === '') {
      alert('Por favor, informe se precisa de troco.')
      return
    }
    if (!whatsappAcknowledged) {
      alert('É necessário confirmar que você irá enviar o pedido pelo WhatsApp para continuar.')
      return
    }
    if (paymentMethod === 'dinheiro' && needsChange === 'sim') {
      const val = parseFloat(changeFor)
      if (!changeFor || isNaN(val) || val <= total) {
        alert('Por favor, informe um valor válido para o troco (deve ser maior que o total).')
        return
      }
    }
    if (!whatsapp) { alert('O WhatsApp da loja ainda não foi configurado no Admin.'); return }
    setSending(true)

    localStorage.setItem('store_name', name)
    localStorage.setItem('store_address', address)
    localStorage.setItem('store_ref', reference)

    const paymentLabel = {
      pix: 'Pix',
      debito: 'Cartão de Débito',
      credito: 'Cartão de Crédito',
      dinheiro: 'Dinheiro',
    }[paymentMethod] || paymentMethod

    /* Supabase / novo modelo multi-loja */
    try {
      await createStoreOrder({
        storeId: currentStore?.id,
        customerName: name,
        customerAddress: address,
        customerReference: reference,
        deliveryType,
        paymentMethod,
        changeFor: paymentMethod === 'dinheiro' && needsChange === 'sim' ? parseFloat(changeFor) : null,
        observation,
        subtotal,
        deliveryFee,
        total,
        items: cart,
      })
    } catch (err) {
      console.error('Erro ao registrar pedido no Supabase:', err)
      alert('Não foi possível registrar o pedido no sistema. O pedido não será enviado pelo WhatsApp até que a gravação seja concluída.')
      setSending(false)
      return
    }

    /* WhatsApp message */
    let msg = `*NOVO PEDIDO - ${store.storeName}*\n\n`
    msg += `*Cliente:* ${name}\n`
    msg += `*Tipo:* Entrega em Domicílio\n`
    msg += `*End:* ${address}\n`
    msg += FREE_DELIVERY_ENABLED ? `*Frete:* Grátis (raio de até ${DELIVERY_RADIUS_KM} km)\n` : `*Frete:* A confirmar pelo WhatsApp\n`
    if (reference) msg += `*Ref:* ${reference}\n`
    msg += `*Pagamento:* ${paymentLabel}\n`
    if (paymentMethod === 'dinheiro') {
      if (needsChange === 'sim') {
        msg += `*Troco para:* R$ ${parseFloat(changeFor).toFixed(2)}\n`
        msg += `*Troco a devolver:* R$ ${changeAmount}\n`
      } else {
        msg += `*Troco:* Sem troco\n`
      }
    }
    if (observation.trim()) msg += `*Observação:* ${observation.trim()}\n`
    msg += `\n*ITENS:*\n`
    cart.forEach(item => {
      const price = Number(item.basePrice || 0)
      msg += `- ${item.qty}x ${item.name} -> R$ ${(price * item.qty).toFixed(2)}\n`
    })
    msg += `\n*SUBTOTAL:* R$ ${subtotal.toFixed(2)}`
    msg += FREE_DELIVERY_ENABLED ? `\n*FRETE:* Grátis` : `\n*FRETE:* A confirmar`
    msg += `\n*TOTAL:* R$ ${total.toFixed(2)}`
    if (paymentMethod === 'pix') {
      msg += `\n\n*PAGAMENTO VIA PIX*`
      msg += `\n*Chave Pix:* ${pixKey}`
      if (pixBeneficiary) msg += `\n*Beneficiário:* ${pixBeneficiary}`
      msg += `\nCopie e cole a chave acima no seu banco de preferência para realizar o pagamento.`
    }

    if (!whatsapp) { alert('O WhatsApp da loja ainda não foi configurado no Admin.'); setSending(false); return }
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')

    clearCart()
    setObservation('')
    onClose()
    setSending(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-grape-900 rounded-t-3xl md:rounded-3xl p-6"
          >
            {/* header */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-grape-200 dark:border-grape-700">
              <h3 className="font-display text-2xl text-gray-800 dark:text-grape-100">
                Finalizar Pedido
              </h3>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-grape-100 dark:bg-grape-800 flex items-center justify-center hover:bg-grape-200 dark:hover:bg-grape-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* cart items */}
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Carrinho vazio.</p>
            ) : (
              <div className="space-y-1 mb-4">
                {cart.map(item => {
                  const price = Number(item.basePrice || 0)
                  return (
                    <div
                      key={item.key}
                      className="flex justify-between items-center py-2.5 border-b border-grape-100 dark:border-grape-800 text-sm"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                          {item.category}
                        </span>
                        <p className="font-medium truncate text-gray-800 dark:text-grape-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          R$ {price.toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateQty(item.key, -1)}
                          className="w-6 h-6 rounded-full border border-grape-300 dark:border-grape-600 flex items-center justify-center text-xs hover:bg-grape-100 dark:hover:bg-grape-800 transition"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="font-bold w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.key, 1)}
                          className="w-6 h-6 rounded-full border border-grape-300 dark:border-grape-600 flex items-center justify-center text-xs hover:bg-grape-100 dark:hover:bg-grape-800 transition"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* totals */}
            {cart.length > 0 && (
              <div className="space-y-1 mb-5 pb-4 border-b border-grape-200 dark:border-grape-700">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal ({totalItems} itens)</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Entrega</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Grátis</span>
                </div>
                <div className="flex justify-between font-display text-xl text-grape-700 dark:text-grape-300 pt-2">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {isBelowMinimum && (
              <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 p-3 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                Pedido mínimo de R$ {MINIMUM_ORDER.toFixed(2)}. Faltam R$ {(MINIMUM_ORDER - subtotal).toFixed(2)} para liberar o pedido.
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-grape-200">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-lg border-2 border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-4 py-3 text-sm focus:border-grape-500 focus:ring-2 focus:ring-grape-500/10 focus:outline-none"
                />
              </div>

              <div className="bg-grape-50 dark:bg-grape-800/50 border-l-4 border-grape-500 rounded-r-lg p-3 text-xs text-gray-500 dark:text-grape-300">
                <strong className="text-grape-600 dark:text-grape-400">
                  Aviso de Frete:
                </strong>{' '}
                {FREE_DELIVERY_ENABLED
                  ? <>Entrega em domicílio <strong>grátis</strong> para distâncias de até <strong>{DELIVERY_RADIUS_KM} km</strong> da loja.</>
                  : <>O frete será <strong>confirmado pelo WhatsApp</strong> conforme a região.</>
                }{' '}
                Pedido mínimo de <strong>R$ {MINIMUM_ORDER.toFixed(2)}</strong>.
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-grape-200">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  className="w-full rounded-lg border-2 border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-4 py-3 text-sm focus:border-grape-500 focus:ring-2 focus:ring-grape-500/10 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-grape-200">
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ex: Próximo à padaria"
                  className="w-full rounded-lg border-2 border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-4 py-3 text-sm focus:border-grape-500 focus:ring-2 focus:ring-grape-500/10 focus:outline-none"
                />
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-grape-200">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'pix', label: 'Pix', sub: null },
                    { value: 'debito', label: 'Débito', sub: 'Trazer a máquina de cartão' },
                    { value: 'credito', label: 'Crédito', sub: 'Trazer a máquina de cartão' },
                    { value: 'dinheiro', label: 'Dinheiro', sub: '' },
                  ]
                    .filter(opt => metodosHabilitados[opt.value] !== false)
                    .map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(opt.value)
                        setNeedsChange('')
                        setChangeFor('')
                      }}
                      className={`checkout-payment-option rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition text-left ${
                        paymentMethod === opt.value
                          ? 'is-selected'
                          : ''
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.sub && (
                        <span className="block text-[10px] font-normal text-orange-500 dark:text-orange-400 mt-0.5 leading-tight">
                          {opt.sub}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pix - confirmação pelo WhatsApp */}
              {paymentMethod === 'pix' && (
                <div className="rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-600/10 p-4 text-center">
                  <p className="text-sm font-bold text-teal-800 dark:text-teal-200">
                    Pagamento via Pix
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-700 dark:text-teal-300">
                    Ao confirmar, seu pedido será enviado pelo WhatsApp. A chave Pix aparecerá na mensagem para você copiar e colar diretamente no seu banco de preferência.
                  </p>
                </div>
              )}

              {/* Troco - somente para dinheiro */}
              {paymentMethod === 'dinheiro' && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/40 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Precisa de troco? *
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setNeedsChange('nao'); setChangeFor('') }}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition ${
                        needsChange === 'nao'
                          ? 'border-green-500 bg-green-100 dark:bg-green-800/40 text-green-800 dark:text-green-300'
                          : 'border-gray-300 dark:border-grape-700 bg-white dark:bg-grape-800 text-gray-600 dark:text-grape-300 hover:border-green-400'
                      }`}
                    >
                      Não preciso
                    </button>
                    <button
                      type="button"
                      onClick={() => setNeedsChange('sim')}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-semibold transition ${
                        needsChange === 'sim'
                          ? 'border-amber-500 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300'
                          : 'border-gray-300 dark:border-grape-700 bg-white dark:bg-grape-800 text-gray-600 dark:text-grape-300 hover:border-amber-400'
                      }`}
                    >
                      Preciso de troco
                    </button>
                  </div>

                  {needsChange === 'sim' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-amber-700 dark:text-amber-300">
                        Troco para quanto? (R$) *
                      </label>
                      <input
                        type="number"
                        min={total + 0.01}
                        step="0.01"
                        value={changeFor}
                        onChange={e => setChangeFor(e.target.value)}
                        placeholder={`Ex: ${(Math.ceil(total / 10) * 10).toFixed(2)}`}
                        className="w-full rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-white dark:bg-grape-800 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                      />
                      {changeAmount !== null && (
                        <p className="mt-1.5 text-xs font-bold text-green-700 dark:text-green-400">
                          Troco a devolver: R$ {changeAmount}
                        </p>
                      )}
                      {changeFor && parseFloat(changeFor) <= total && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">
                          O valor deve ser maior que o total de R$ {total.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Etapa obrigatória: envio pelo WhatsApp */}
              <div className="rounded-xl border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 font-black">WA</div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-green-900 dark:text-green-200">Envio pelo WhatsApp é necessário</p>
                    <p className="mt-1 text-xs leading-relaxed text-green-800 dark:text-green-300">
                      Para concluir o pedido, você precisa confirmar o envio. Ao continuar, o WhatsApp será aberto com o pedido já preenchido para você enviar à loja.
                    </p>
                  </div>
                </div>
                <label className="mt-3 flex items-start gap-2 cursor-pointer text-xs font-semibold text-green-900 dark:text-green-200">
                  <input
                    type="checkbox"
                    checked={whatsappAcknowledged}
                    onChange={e => setWhatsappAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-green-600"
                  />
                  <span>Entendi que preciso enviar o pedido pelo WhatsApp para finalizar.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sending || cart.length === 0 || isBelowMinimum || !whatsappAcknowledged}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-500 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? 'Enviando...'
                  : isBelowMinimum
                  ? `Pedido mínimo de R$ ${MINIMUM_ORDER.toFixed(2)}`
                  : 'Confirmar e Enviar no WhatsApp'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
