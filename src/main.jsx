import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  LayoutDashboard, Store, Users, CreditCard, LogOut, Plus,
  Search, X, LoaderCircle, ShieldCheck, ExternalLink
} from 'lucide-react'
import { supabase } from './supabase'
import './styles.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [stores, setStores] = useState([])
  const [plans, setPlans] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function checkSession() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)

    if (session) {
      const { data, error } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setAuthorized(Boolean(data) && !error)
    } else {
      setAuthorized(false)
    }

    setLoading(false)
  }

  async function loadData() {
    const [storeResult, planResult] = await Promise.all([
      supabase.from('stores').select('*').order('created_at', { ascending: false }),
      supabase.from('plans').select('*').order('price', { ascending: true })
    ])

    if (storeResult.error) setError(storeResult.error.message)
    else setStores(storeResult.data || [])

    if (!planResult.error) setPlans(planResult.data || [])
  }

  useEffect(() => {
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        if (!newSession) {
          setAuthorized(false)
          setStores([])
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && authorized) loadData()
  }, [session, authorized])

  async function logout() {
    await supabase.auth.signOut()
    setPage('dashboard')
  }

  if (loading) return <Splash />
  if (!session) return <Login onLoggedIn={checkSession} />
  if (!authorized) return <Unauthorized onLogout={logout} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">🦍</div>
          <div>
            <strong>MENU GORILA</strong>
            <span>PAINEL MASTER</span>
          </div>
        </div>

        <nav>
          <NavItem icon={<LayoutDashboard size={18}/>} label="Dashboard"
            active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon={<Store size={18}/>} label="Lojas"
            active={page === 'stores'} onClick={() => setPage('stores')} />
          <NavItem icon={<Users size={18}/>} label="Clientes"
            active={page === 'customers'} onClick={() => setPage('customers')} />
          <NavItem icon={<CreditCard size={18}/>} label="Planos"
            active={page === 'plans'} onClick={() => setPage('plans')} />
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-badge"><ShieldCheck size={16}/> Acesso Master</div>
          <button className="logout" onClick={logout}>
            <LogOut size={17}/> Sair
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">PLATAFORMA</div>
            <h1>
              {page === 'dashboard' ? 'Dashboard' :
               page === 'stores' ? 'Lojas' :
               page === 'customers' ? 'Clientes' : 'Planos'}
            </h1>
          </div>

          <div className="top-actions">
            <span className="user-email">{session.user.email}</span>
            {page !== 'plans' && (
              <button className="primary" onClick={() => {
                setError('')
                setMessage('')
                setShowModal(true)
              }}>
                <Plus size={18}/> Nova loja
              </button>
            )}
          </div>
        </header>

        {message && <Alert type="success" text={message} onClose={() => setMessage('')} />}
        {error && <Alert type="error" text={error} onClose={() => setError('')} />}

        {page === 'dashboard' &&
          <Dashboard stores={stores} plans={plans} onNew={() => setShowModal(true)} />}

        {page === 'stores' &&
          <Stores stores={stores} onRefresh={loadData} />}

        {page === 'customers' &&
          <Customers stores={stores} />}

        {page === 'plans' &&
          <Plans plans={plans} />}

        {showModal && (
          <CreateStoreModal
            plans={plans}
            onClose={() => setShowModal(false)}
            onCreated={async (text) => {
              setShowModal(false)
              setMessage(text)
              await loadData()
              setPage('stores')
            }}
            onError={(text) => setError(text)}
          />
        )}
      </main>
    </div>
  )
}

function Splash() {
  return (
    <div className="center-screen">
      <div>
        <LoaderCircle className="spin" size={34}/>
        <span>Carregando Menu Gorila...</span>
      </div>
    </div>
  )
}

function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error) setError(error.message)
    else await onLoggedIn()

    setBusy(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🦍</div>
        <div className="eyebrow">MENU GORILA</div>
        <h1>Painel Master</h1>
        <p>Administre lojas, clientes e planos da plataforma.</p>

        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary wide" disabled={busy}>
            {busy
              ? <><LoaderCircle className="spin" size={18}/> Entrando...</>
              : 'Entrar no painel'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Unauthorized({ onLogout }) {
  return (
    <div className="center-screen">
      <div className="empty-card">
        <ShieldCheck size={42}/>
        <h2>Usuário sem acesso Master</h2>
        <p>
          Este usuário está autenticado, mas não está cadastrado
          como administrador da plataforma.
        </p>
        <button className="secondary" onClick={onLogout}>
          Voltar para o login
        </button>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={'nav-item ' + (active ? 'active' : '')} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  )
}

function Dashboard({ stores, plans, onNew }) {
  const active = stores.filter(s => s.active).length
  const inactive = stores.length - active

  return (
    <section>
      <div className="hero">
        <div>
          <span className="eyebrow">VISÃO GERAL</span>
          <h2>Seu SaaS em um só lugar.</h2>
          <p>Crie e administre lojas independentes usando a mesma plataforma.</p>
        </div>
        <button className="primary" onClick={onNew}>
          <Plus size={18}/> Cadastrar cliente
        </button>
      </div>

      <div className="stats">
        <Stat label="Lojas" value={stores.length} icon={<Store/>}/>
        <Stat label="Lojas ativas" value={active} icon={<ShieldCheck/>}/>
        <Stat label="Inativas" value={inactive} icon={<Store/>}/>
        <Stat label="Planos" value={plans.length} icon={<CreditCard/>}/>
      </div>

      <div className="section-head">
        <h3>Lojas recentes</h3>
        <span>{stores.length} cadastrada(s)</span>
      </div>

      <StoreTable stores={stores.slice(0, 8)} />
    </section>
  )
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function Stores({ stores, onRefresh }) {
  const [q, setQ] = useState('')

  const filtered = stores.filter(s =>
    (s.name + ' ' + s.slug + ' ' + (s.city || ''))
      .toLowerCase()
      .includes(q.toLowerCase())
  )

  return (
    <section>
      <div className="toolbar">
        <div className="search">
          <Search size={18}/>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar loja..."
          />
        </div>
        <button className="secondary" onClick={onRefresh}>Atualizar</button>
      </div>

      <StoreTable stores={filtered} />
    </section>
  )
}

function StoreTable({ stores }) {
  if (!stores.length) {
    return (
      <div className="empty-card">
        <Store size={32}/>
        <h3>Nenhuma loja cadastrada</h3>
        <p>Use “Nova loja” para criar a primeira.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Loja</th>
            <th>Slug</th>
            <th>Cidade</th>
            <th>Entrega</th>
            <th>Status</th>
            <th>Cardápio</th>
          </tr>
        </thead>

        <tbody>
          {stores.map(s => (
            <tr key={s.id}>
              <td>
                <strong>{s.name}</strong>
                <small>{s.description || 'Sem descrição'}</small>
              </td>
              <td><code>{s.slug}</code></td>
              <td>{s.city || '—'}</td>
              <td>
                R$ {Number(s.delivery_fee || 0).toFixed(2).replace('.', ',')}
              </td>
              <td>
                <span className={'pill ' + (s.active ? 'on' : 'off')}>
                  {s.active ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td>
                <a href={'/loja/' + s.slug} target="_blank" rel="noreferrer">
                  <ExternalLink size={15}/> Abrir
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Customers({ stores }) {
  return (
    <section>
      <div className="hero compact">
        <div>
          <span className="eyebrow">CLIENTES</span>
          <h2>Clientes e suas lojas</h2>
          <p>Na V1, cada cliente representa o proprietário de uma loja.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Loja</th>
              <th>WhatsApp</th>
              <th>Cidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <small>{s.slug}</small>
                </td>
                <td>{s.whatsapp || '—'}</td>
                <td>{s.city || '—'}</td>
                <td>
                  <span className={'pill ' + (s.active ? 'on' : 'off')}>
                    {s.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Plans({ plans }) {
  return (
    <section>
      <div className="hero compact">
        <div>
          <span className="eyebrow">ASSINATURAS</span>
          <h2>Planos</h2>
          <p>Os planos cadastrados no seu banco Supabase.</p>
        </div>
      </div>

      <div className="plan-grid">
        {plans.map(p => (
          <div className="plan-card" key={p.id}>
            <span className="eyebrow">{p.billing_period}</span>
            <h3>{p.name}</h3>
            <strong>
              R$ {Number(p.price || 0).toFixed(2).replace('.', ',')}
            </strong>
            <p>{p.description || 'Sem descrição'}</p>
            <small>
              {p.max_products == null ? 'Produtos ilimitados' : p.max_products + ' produtos'}
              {' · '}
              {p.max_users == null ? 'Usuários ilimitados' : p.max_users + ' usuário(s)'}
            </small>
          </div>
        ))}
      </div>
    </section>
  )
}

function CreateStoreModal({ plans, onClose, onCreated, onError }) {
  const [form, setForm] = useState({
    customer_name: '',
    email: '',
    password: '',
    store_name: '',
    slug: '',
    whatsapp: '',
    address: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    delivery_fee: '6.00',
    plan_id: plans[0]?.id || ''
  })

  const [busy, setBusy] = useState(false)

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function slugify(v) {
    return v.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    onError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sua sessão expirou. Entre novamente.')

      const { data, error } = await supabase.functions.invoke(
        'create-client',
        {
          body: form,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      )

      if (error) throw new Error(error.message || 'Erro ao chamar a função.')
      if (!data?.ok) throw new Error(data?.error || 'Não foi possível criar a loja.')

      await onCreated('Cliente e loja criados com sucesso.')
    } catch (e) {
      onError(e.message || 'Erro inesperado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">NOVO CLIENTE</span>
            <h2>Cadastrar loja</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X/>
          </button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Nome do cliente
              <input value={form.customer_name}
                onChange={e => update('customer_name', e.target.value)} required />
            </label>

            <label>
              E-mail
              <input type="email" value={form.email}
                onChange={e => update('email', e.target.value)} required />
            </label>

            <label>
              Senha inicial
              <input type="password" minLength="8" value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="mínimo 8 caracteres" required />
            </label>

            <label>
              Nome da loja
              <input value={form.store_name}
                onChange={e => {
                  update('store_name', e.target.value)
                  if (!form.slug) update('slug', slugify(e.target.value))
                }} required />
            </label>

            <label>
              Slug / endereço curto
              <input value={form.slug}
                onChange={e => update('slug', slugify(e.target.value))} required />
              <small>Ex.: sorvetes-do-joao</small>
            </label>

            <label>
              WhatsApp
              <input value={form.whatsapp}
                onChange={e => update('whatsapp', e.target.value)} />
            </label>

            <label className="full">
              Endereço
              <input value={form.address}
                onChange={e => update('address', e.target.value)} />
            </label>

            <label>
              Bairro
              <input value={form.neighborhood}
                onChange={e => update('neighborhood', e.target.value)} />
            </label>

            <label>
              Cidade
              <input value={form.city}
                onChange={e => update('city', e.target.value)} />
            </label>

            <label>
              Estado
              <input maxLength="2" value={form.state}
                onChange={e => update('state', e.target.value.toUpperCase())} />
            </label>

            <label>
              Taxa de entrega
              <input type="number" step="0.01" min="0"
                value={form.delivery_fee}
                onChange={e => update('delivery_fee', e.target.value)} />
            </label>

            <label>
              Plano
              <select value={form.plan_id}
                onChange={e => update('plan_id', e.target.value)}>
                {plans.map(p => (
                  <option value={p.id} key={p.id}>
                    {p.name} — R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary" disabled={busy}>
              {busy
                ? <><LoaderCircle className="spin" size={18}/> Criando...</>
                : <><Plus size={18}/> Criar cliente e loja</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Alert({ type, text, onClose }) {
  return (
    <div className={'alert ' + type}>
      <span>{text}</span>
      <button onClick={onClose}><X size={16}/></button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
