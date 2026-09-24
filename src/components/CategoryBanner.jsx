import { ChevronRight } from 'lucide-react'

export default function CategoryBanner({ categoryId, title, imageUrl }) {
  return (
    <div className="menu-99-category-heading" id={`categoria-${categoryId}`}>
      <div>
        <h2>{title}</h2>
        <span>Confira as opções</span>
      </div>
      {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
      <ChevronRight size={18} aria-hidden="true" />
    </div>
  )
}
