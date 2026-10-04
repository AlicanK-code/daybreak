// Serves the production build (dist/) with the same headers Vercel sends, from vercel.json, so the
// end-to-end tests run under the real Content Security Policy.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const root = join(import.meta.dirname, '..')
const dist = join(root, 'dist')
const port = Number(process.env.PORT ?? 4180)
const headers = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).headers.flatMap((rule) => rule.headers)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
}

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
  let file = join(dist, path)
  if (!file.startsWith(dist)) {
    res.writeHead(400).end()
    return
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  for (const h of headers) res.setHeader(h.key, h.value)
  if (!existsSync(file)) {
    res.writeHead(404).end('Not found')
    return
  }
  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
  res.end(readFileSync(file))
}).listen(port, () => console.log(`Serving dist/ on http://localhost:${port}`))
