import { supabase } from '../supabase'

export async function createStoreOrder({
  storeId,
  customerName,
  customerAddress,
  customerReference,
  deliveryType,
  paymentMethod,
  changeFor,
  observation,
  subtotal,
  deliveryFee,
  total,
  items,
}) {
  if (!storeId) throw new Error('Loja não identificada para este pedido.')

  const orderPayload = {
    store_id: storeId,
    customer_name: String(customerName || '').trim(),
    customer_address: String(customerAddress || '').trim(),
    customer_reference: String(customerReference || '').trim(),
    delivery_type: deliveryType || 'entrega',
    payment_method: paymentMethod,
    change_for: changeFor == null ? null : Number(changeFor),
    observation: String(observation || '').trim(),
    subtotal: Number(subtotal || 0),
    delivery_fee: Number(deliveryFee || 0),
    total: Number(total || 0),
  }

  const itemRows = (items || []).map(item => ({
    store_id: storeId,
    product_id: item.productId || null,
    product_name: item.name,
    quantity: Number(item.qty || 1),
    unit_price: Number(item.basePrice || 0),
    addons: Array.isArray(item.addonDetails) ? item.addonDetails : [],
    total: Number(item.basePrice || 0) * Number(item.qty || 1),
  }))

  if (!itemRows.length) throw new Error('O pedido não possui itens.')

  // O checkout público é feito por visitantes sem login. A gravação direta
  // em orders/order_items depende de RLS e pode ser bloqueada para anon.
  // A RPC grava pedido + itens em uma única transação, com validação do store_id.
  const { data, error } = await supabase.rpc('create_public_order', {
    p_order: orderPayload,
    p_items: itemRows,
  })

  if (error) throw error

  const orderId = typeof data === 'string' ? data : data?.id
  if (!orderId) throw new Error('O Supabase confirmou a operação, mas não retornou o ID do pedido.')

  return { id: orderId }
}
