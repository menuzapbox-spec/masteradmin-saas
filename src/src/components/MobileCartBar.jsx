import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'

export default function MobileCartBar({ onClick }) {
  const { totalItems, total } = useCart()

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onClick}
          className="btn-3d lg:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-40 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-grape-900 to-grape-700 px-4 sm:px-6 py-3.5 sm:py-4 text-white shadow-[0_5px_0_#2e1065,0_14px_28px_rgba(106,27,154,0.35)]"
        >
          <span className="flex min-w-0 items-center gap-2 font-semibold text-sm">
            <ShoppingBag size={18} /> Ver Carrinho
          </span>
          <span className="shrink-0 text-xs sm:text-sm font-bold">
            {totalItems} {totalItems === 1 ? 'item' : 'itens'} | R$ {total.toFixed(2)}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
