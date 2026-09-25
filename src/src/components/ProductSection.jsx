import { motion } from 'framer-motion'
import { SimpleCard, AddonCard, SizeSelectCard } from './ProductCard'
import CategoryBanner from './CategoryBanner'
import { getProductImage } from '../data/productImages'

export default function ProductSection({ section, searchQuery }) {
  /* size-select (Açaí em Litro) */
  if (section.type === 'size-select') {
    const matches =
      !searchQuery ||
      section.productName.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matches) return null

    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-10"
      >
        <CategoryBanner categoryId={section.categoryId} title={section.title} imageUrl={section.imageUrl} />
        <SizeSelectCard
          imageUrl={getProductImage({ name: section.productName, category: section.category }, section)}
          name={section.productName}
          category={section.category}
          sizes={section.sizes}
          index={0}
        />
      </motion.section>
    )
  }

  /* filter items by search */
  const filtered = section.items.filter(
    item => !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  if (filtered.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 sm:mb-10"
    >
      <CategoryBanner categoryId={section.categoryId} title={section.title} imageUrl={section.imageUrl} />

      {section.info && (
        <div className="bg-gradient-to-r from-grape-50 to-grape-100/50 dark:from-grape-900/50 dark:to-grape-800/30 border border-grape-200 dark:border-grape-700 rounded-xl p-3.5 sm:p-4 mb-4 text-xs sm:text-sm text-gray-600 dark:text-grape-300 shadow-sm">
          {section.info}
        </div>
      )}

      <div className="menu-99-product-list">
        {filtered.map((item, i) =>
          (section.type === 'addon' || Array.isArray(item.addons)) && (item.addons?.length || section.addons?.length) ? (
            <AddonCard key={item.name} item={{ ...item, imageUrl: getProductImage(item, section), maxAddons: item.maxAddons || section.maxAddons }} addons={item.addons ?? section.addons} index={i} />
          ) : (
            <SimpleCard
              key={item.name}
              item={{
                ...item,
                price: item.price,
                imageUrl: getProductImage(item, section),
              }}
              index={i}
            />
          )
        )}
      </div>
    </motion.section>
  )
}
