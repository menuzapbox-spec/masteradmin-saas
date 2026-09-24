// Gera dist/_redirects para o Cloudflare Pages depois do build do Vite.
// O mesmo build (dist/) serve tanto o site quanto o admin — o que muda é
// para qual arquivo o Cloudflare deve redirecionar as rotas desconhecidas.
// Controlado pela env var DEPLOY_TARGET, configurada em cada projeto do
// Cloudflare Pages (não altera o build usado pelo Render).
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = (process.env.DEPLOY_TARGET || 'site').toLowerCase()
const destino = target === 'admin' ? '/admin-1.html' : '/index.html'
const conteudo = `/*  ${destino}  200\n`

writeFileSync(resolve(process.cwd(), 'dist/_redirects'), conteudo)
console.log(`[cloudflare] _redirects gerado -> ${destino} (DEPLOY_TARGET=${target})`)
