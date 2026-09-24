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

export default defineConfig({
  plugins: [react(), copyAdminAssets()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin-1.html')
      }
    }
  }
})
