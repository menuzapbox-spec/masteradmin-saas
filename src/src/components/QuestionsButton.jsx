import { useState } from 'react'
import { MessageCircle, X, Truck, Clock3, CreditCard, ShoppingBag, UserRound } from 'lucide-react'
import whatsappLogo from '../assets/whatsapp-logo.png'
import { useStoreSettings } from '../data/useStoreSettings'


export default function QuestionsButton({ externalOpen = false, onExternalClose, context = 'site' }) {
  const [open, setOpen] = useState(false)
  const store = useStoreSettings()
  const whatsapp = String(store.whatsapp || store.phone || '').replace(/\D/g, '')
  const storeKey = store.storeId || 'loja'
  const [name, setName] = useState(() => localStorage.getItem(`store_${storeKey}_customer_name`) || '')
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)

  const isOpen = open || externalOpen
  const contextLabel = context === 'landing' ? 'Landing Page' : context === 'cardapio' ? 'Cardápio' : 'Site'
  const quickTopics = [
    ['pedido', 'Quero fazer um pedido', ShoppingBag],
    ['entrega', 'Quero saber sobre entrega', Truck],
    ['horario', 'Quero saber o horário', Clock3],
    ['pagamento', 'Quero saber sobre pagamento', CreditCard],
    ['atendente', 'Quero falar com a loja', null],
  ]

  function close() {
    setOpen(false)
    onExternalClose?.()
  }

  function openChat(topic = '') {
    if (!whatsapp) { alert('O WhatsApp da loja ainda não foi configurado no Admin.'); return }
    const nameValue = name.trim() || 'Cliente'
    const topicText = topic ? quickTopics.find(([key]) => key === topic)?.[1] : ''
    const msg = `*ATENDIMENTO - ${store.storeName}*\n\n*Cliente:* ${nameValue}\n*Origem:* ${contextLabel}${topicText ? `\n*Assunto:* ${topicText}` : ''}`
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
    if (name.trim()) localStorage.setItem(`store_${storeKey}_customer_name`, name.trim())
    close()
  }

  async function submit(e) {
    e.preventDefault()
    if (!question.trim()) return
    if (!whatsapp) { alert('O WhatsApp da loja ainda não foi configurado no Admin.'); return }
    setSending(true)
    const data = { nome: name.trim() || 'Cliente', duvida: question.trim() }
    const msg = `*DÚVIDA - ${store.storeName}*\n\n*Cliente:* ${data.nome}\n*Dúvida:* ${data.duvida}`
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank')
    if (name.trim()) localStorage.setItem(`store_${storeKey}_customer_name`, name.trim())
    setQuestion('')
    setSending(false)
    close()
  }

  return <>
    <button onClick={() => setOpen(true)} className="store-contact-fab fixed left-4 bottom-4 z-40 rounded-full bg-white dark:bg-grape-900 border border-grape-200 dark:border-grape-700 px-4 py-3 shadow-xl font-bold text-sm flex items-center gap-2 hover:-translate-y-0.5 transition" aria-label="Falar com a loja pelo WhatsApp">
      <img src={whatsappLogo} alt="WhatsApp" className="whatsapp-fab-logo" /> FALAR COM A LOJA
    </button>
    {isOpen && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-grape-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5"><div><h3 className="text-xl font-bold">Fale com a loja</h3><p className="text-sm text-gray-500 mt-1">Atendimento direto pelo WhatsApp.</p></div><button onClick={close} className="w-9 h-9 rounded-full bg-grape-100 dark:bg-grape-800 grid place-items-center"><X size={18}/></button></div>
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome (opcional)" className="w-full rounded-xl border-2 border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-4 py-3 text-sm outline-none focus:border-grape-500" />
          <div className="grid grid-cols-2 gap-2">
            {quickTopics.map(([key, label, Icon]) => (
              <button key={key} type="button" onClick={() => { openChat(key) }} className="flex items-center gap-2 rounded-xl border border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-3 py-3 text-left text-xs font-bold hover:border-grape-400 transition">
                {key === 'atendente' ? <img src={whatsappLogo} alt="WhatsApp" className="whatsapp-topic-logo" /> : <Icon size={16} className="text-green-600 shrink-0" />} {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea required value={question} onChange={e => setQuestion(e.target.value.slice(0,500))} rows={4} maxLength={500} placeholder="Ou escreva sua mensagem para a loja..." className="w-full resize-none rounded-xl border-2 border-grape-200 dark:border-grape-700 bg-grape-50 dark:bg-grape-800 px-4 py-3 text-sm outline-none focus:border-grape-500" />
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">{question.length}/500</div>
          </div>
          <button disabled={sending || !question.trim()} className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-4 font-bold disabled:opacity-50">{sending ? 'Enviando...' : <> <img src={whatsappLogo} alt="WhatsApp" className="whatsapp-button-logo" /> Falar com a loja pelo WhatsApp </>}</button>
        </form>
      </div>
    </div>}
  </>
}
