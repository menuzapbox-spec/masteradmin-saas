import { Info } from 'lucide-react'

export default function CustomerNotice({ message, enabled }) {
  const text = String(message || '').trim()
  if (!enabled || !text) return null

  return (
    <aside className="store-customer-notice" role="status" aria-label="Aviso da loja">
      <div className="store-customer-notice-head">
        <span className="store-customer-notice-icon"><Info size={16} strokeWidth={2.5} /></span>
        <strong>AVISO</strong>
      </div>
      <p>{text}</p>
    </aside>
  )
}
