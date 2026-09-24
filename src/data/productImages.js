// WHITE LABEL: nenhuma imagem de catálogo vem embutida no código.
// A imagem cadastrada pelo Admin tem prioridade; sem imagem, o card mostra o placeholder visual.
export function getProductImage(item = {}, section = {}) {
  return item.imageUrl || item.imagem || section.imageUrl || ''
}
