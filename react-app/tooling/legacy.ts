import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const files: Record<string, string> = {
  'index.html': 'text/html; charset=utf-8',
  'login.html': 'text/html; charset=utf-8',
  'auth.js': 'text/javascript; charset=utf-8',
  'script.js': 'text/javascript; charset=utf-8',
  'login.js': 'text/javascript; charset=utf-8',
  'login-page.js': 'text/javascript; charset=utf-8',
  'data-utils.js': 'text/javascript; charset=utf-8',
  'contact.js': 'text/javascript; charset=utf-8',
  'style.css': 'text/css; charset=utf-8',
  'logo.png': 'image/png',
}

function readLegacyFile(name: string) {
  return readFileSync(fileURLToPath(new URL(`../../${name}`, import.meta.url)))
}

export function legacyPanel(): Plugin {
  return {
    name: 'attento-legacy-panel',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url || '').split('?')[0]
        if (!pathname.startsWith('/legacy/')) return next()
        const name = pathname.slice('/legacy/'.length)
        if (!Object.hasOwn(files, name)) {
          response.statusCode = 404
          response.end('Arquivo não encontrado')
          return
        }
        try {
          response.setHeader('Content-Type', files[name])
          response.setHeader('Cache-Control', 'no-store')
          response.end(readLegacyFile(name))
        } catch (error) {
          next(error)
        }
      })
    },
    generateBundle() {
      for (const name of Object.keys(files)) {
        this.emitFile({ type: 'asset', fileName: `legacy/${name}`, source: readLegacyFile(name) })
      }
    },
  }
}
