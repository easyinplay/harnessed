// Thin HTTP wrapper over the store — GET /todos?dueBefore=YYYY-MM-DD&includeDone=0|1.
// Kept separate from store logic so the store is unit-testable without sockets.

import { createServer as createHttpServer } from 'node:http'

export function createServer(store) {
  return createHttpServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/todos') {
      const dueBefore = url.searchParams.get('dueBefore')
      const includeDone = url.searchParams.get('includeDone') !== '0'
      const body = store.list({ dueBefore, includeDone })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(body))
      return
    }
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: 'not found' }))
  })
}
