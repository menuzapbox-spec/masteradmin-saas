import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync } from 'fs'

// White Label: gera também o painel administrativo como uma página Vite real.
// O painel usa caminhos legados para os ícones em src/assets; por isso
// preservamos esses caminhos no dist sem alterar o HTML/visual do Admin.
const copyAdminAssets = () => ({
  name: 'copy-admin-assets',
  closeBundle() {
    cpSync(
      resolve(process.cwd(), 'src/assets'),
      resolve(process.cwd(), 'dist/src/assets'),
      { recursive: true }
    )
  }
})

// Render Static Site pode devolver 404 quando o navegador entra diretamente
// em uma rota SPA, como /loja/minha-loja. Geramos uma cópia do index.html
// como 404.html para que o próprio React assuma a rota e resolva o slug.
// Não altera a lógica do catálogo, do Admin ou do Supabase.
const spaFallback = () => ({
  name: 'spa-fallback',
  closeBundle() {
    cpSync(
      resolve(process.cwd(), 'dist/index.html'),
      resolve(process.cwd(), 'dist/404.html')
    )
  }
})

export default defineConfig({
  plugins: [react(), copyAdminAssets(), spaFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin-1.html')
      }
    }
  }
})
