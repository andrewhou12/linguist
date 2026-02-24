import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const sharedPath = resolve(__dirname, '../../packages/shared/src')
const corePath = resolve(__dirname, '../../packages/core/src')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({
      exclude: ['@linguist/shared', '@linguist/core', '@linguist/db'],
    })],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.ts')
      }
    },
    resolve: {
      alias: {
        '@shared': sharedPath,
        '@core': corePath,
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({
      exclude: ['@linguist/shared'],
    })],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts')
      }
    },
    resolve: {
      alias: {
        '@shared': sharedPath,
      }
    }
  },
  renderer: {
    root: 'src',
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/index.html')
      }
    },
    resolve: {
      alias: {
        '@shared': sharedPath,
      }
    },
    plugins: [tailwindcss(), react()]
  }
})
