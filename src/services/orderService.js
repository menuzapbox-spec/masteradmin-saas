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
    customer_name: customerName,
    customer_address: customerAddress,
    customer_reference: customerReference || '',
    delivery_type: deliveryType || 'entrega',
    payment_method: paymentMethod,
    change_for: changeFor || null,
    observation: observation || '',
    subtotal: Number(subtotal || 0),
    delivery_fee: Number(deliveryFee || 0),
    total: Number(total || 0),
    status: 'pending',
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id')
    .single()

  if (orderError) throw orderError

  const itemRows = (items || []).map(item => ({
    order_id: order.id,
    store_id: storeId,
    product_id: item.productId || null,
    product_name: item.name,
    quantity: Number(item.qty || 1),
    unit_price: Number(item.basePrice || 0),
    addons: item.addonDetails || [],
    total: Number(item.basePrice || 0) * Number(item.qty || 1),
  }))

  if (itemRows.length) {
    const { error: itemsError } = await supabase.from('order_items').insert(itemRows)
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id).eq('store_id', storeId)
      throw itemsError
    }
  }

  return order
}
