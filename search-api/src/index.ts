import { createServer } from 'node:http';
import { hybridSearch } from './routes/hybrid-search.js';

const server = createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/search/hybrid') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const result = hybridSearch(JSON.parse(body || '{}'));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.listen(8787, '127.0.0.1', () => {
  console.log('Search API listening on http://127.0.0.1:8787');
});
