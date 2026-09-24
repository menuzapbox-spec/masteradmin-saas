import { motion } from 'framer-motion'
import { ArrowRight, Bike, CheckCircle2, ShoppingBag, Sparkles, Zap, MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useStoreSettings } from '../data/useStoreSettings'
import whatsappLogo from '../assets/whatsapp-logo.png'

const money = value => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`

export default function LandingHero({ sections, landingSettings, activeCategory, onCategory, onOpenCart, onContact }) {
  const { addItem, totalItems, total } = useCart()
  const store = useStoreSettings()

  const allItems = sections.flatMap(section =>
    section.items ? section.items.map(item => ({ ...item, sectionId: section.id, sectionTitle: section.title })) : []
  )
  const hasManualSelection = (landingSettings?.featuredCategoryIds || []).length > 0 || (landingSettings?.featuredProductKeys || []).length > 0
  const selectedCategoryIds = new Set((landingSettings?.featuredCategoryIds || []).map(String))
  const selectedProductKeys = new Set((landingSettings?.featuredProductKeys || []).map(String))
  const manualProducts = allItems.filter(item => selectedProductKeys.has(`${item.sectionId}::${item.name}`) && Number(item.price) > 0)
  const categoryProducts = selectedCategoryIds.size
    ? allItems.filter(item => selectedCategoryIds.has(String(item.sectionId)) && Number(item.price) > 0)
    : []
  const featuredPool = selectedProductKeys.size ? manualProducts : categoryProducts
  const featuredRegular = hasManualSelection
    ? featuredPool.slice(0, 6)
    : allItems.filter(item => Number(item.price) > 0).slice(0, 6)
  const featured = featuredRegular
  const categories = sections.map(section => [section.categoryId || section.id, section.title]).filter(([id]) => id)
  const landingCategories = [{ id: 'all', label: 'Todos' }, ...categories.map(([id, label]) => ({ id, label }))]

  const choose = id => {
    onCategory(id)
    setTimeout(() => document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-8">
            <div>
              <div className="landing-pill"><Sparkles size={15}/> {store.tagline}</div>
              <h1>{store.storeName} <span>do seu jeito.</span></h1>
              <p className="landing-subtitle">
                {store.subtitle}
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="landing-cta" onClick={() => document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})}>
                  <ShoppingBag size={19}/> PEDIR AGORA <ArrowRight size={18}/>
                </button>
                <button className="landing-secondary" onClick={() => document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})}>
                  Ver cardápio <ArrowRight size={18}/>
                </button>
                <button className="landing-contact-cta" onClick={onContact}>
                  <img src={whatsappLogo} alt="WhatsApp" className="whatsapp-button-logo"/> FALAR COM A LOJA
                </button>
              </div>
              <div className="landing-trust">
                <span><Zap size={15}/> Pedido online</span>
                <span><Bike size={15}/> Delivery</span>
                <span><CheckCircle2 size={15}/> Catálogo atualizado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="landing-category-bar" aria-label="Categorias do cardápio">
        <div className="landing-category-bar-inner">
          <div className="landing-category-bar-scroll">
            {landingCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => choose(cat.id)}
                aria-current={activeCategory === cat.id ? 'page' : undefined}
                className={`landing-category-chip ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="landing-benefits">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-5 md:grid-cols-4">
          {[
            [<Sparkles size={20}/>, 'Muito sabor', 'Opções para todos os gostos'],
            [<Bike size={20}/>, 'Delivery', 'Peça sem sair de casa'],
            [<ShoppingBag size={20}/>, 'Fácil de pedir', 'Tudo pelo cardápio online'],
            [<CheckCircle2 size={20}/>, 'Sua loja', 'Catálogo sempre atualizado'],
          ].map(([icon,title,text]) => (
            <div className="landing-benefit" key={title}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="landing-section-head">
          <div><span>ESCOLHA O SEU</span><h2>Qual combina com você?</h2></div>
          <button onClick={() => document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})}>Ver tudo <ArrowRight size={17}/></button>
        </div>
        <div className="landing-categories">
          {categories.map(([id,label]) => (
            <button key={id} onClick={() => choose(id)} className="landing-category">
              {(sections.find(section => (section.categoryId || section.id) === id)?.imageUrl) ? (
                <img src={sections.find(section => (section.categoryId || section.id) === id)?.imageUrl} alt={label} loading="lazy" className="landing-category-thumb" />
              ) : (
                <span className="landing-category-mark" aria-hidden="true"><Sparkles size={22}/></span>
              )}
              <b>{label}</b><small>Ver produtos <ArrowRight size={13}/></small>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-featured">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="landing-section-head">
            <div><span>OS MAIS PEDIDOS</span><h2>Escolhas que fazem sucesso</h2></div>
            <button onClick={() => document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})}>Abrir cardápio <ArrowRight size={17}/></button>
          </div>
          <div className="landing-feature-grid">
            {featured.length === 0 && <div className="landing-empty-state">Configure categorias e produtos no Admin para começar a vender.</div>}
            {featured.map((item, i) => (
              <motion.div key={`${item.name}-${i}`} className="landing-feature-card" whileHover={{y:-4}}>
                <div className="landing-feature-image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy"/> : <ShoppingBag size={48}/>}
                </div>
                <div className="landing-feature-body">
                  <small>{item.sectionTitle}</small><h3>{item.name}</h3>
                  <div className="flex items-center justify-between gap-2">
                    <strong>{money(item.price)}</strong>
                    <button onClick={() => addItem({key:`landing-${item.name}-${item.category}`,name:item.name,basePrice:item.price,category:item.category,imageUrl:item.imageUrl||''})}>
                      + Adicionar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="landing-offer">
          <div><span>BATEU VONTADE?</span><h2>Seu pedido começa aqui.</h2><p>Escolha suas delícias, monte o carrinho e finalize pelo nosso cardápio. Simples, rápido e do seu jeito.</p></div>
          <button onClick={() => document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})}>MONTAR MEU PEDIDO <ArrowRight size={19}/></button>
        </div>
      </section>

      <section className="landing-how">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="text-center"><span>COMO FUNCIONA</span><h2>Seu pedido é simples</h2></div>
          <div className="landing-steps">
            <div><i>1</i><b>Escolha</b><p>Encontre seu sabor, açaí, picolé ou pote.</p></div>
            <div><i>2</i><b>Adicione</b><p>Monte o carrinho com quantidades e complementos.</p></div>
            <div><i>3</i><b>Finalize</b><p>Continue para o checkout do sistema atual.</p></div>
          </div>
        </div>
      </section>

      <div className="landing-sticky-cta">
        <div><b>{totalItems ? `${totalItems} item(ns) no carrinho` : 'Pronto para pedir?'}</b><small>{totalItems ? money(total) : 'Escolha suas delícias favoritas'}</small></div>
        <button onClick={() => {
          if (totalItems && onOpenCart) {
            onOpenCart()
          } else {
            document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'})
          }
        }}>{totalItems ? 'VER CARRINHO' : 'PEDIR AGORA'}</button>
      </div>
    </div>
  )
}
