import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reference=process.argv.includes('--reference');
const root=path.resolve(project,reference?'../Template/dest':'dist/inkers-core-ecommerce-ui/browser');
const port=reference?4301:4302;
const routes=new Set(['/', '/home', '/home-fashion.html', '/products', '/shop.html', '/product-details', '/product-single-default.html', '/cart', '/cart.html', '/checkout', '/checkout-delivery-step-one.html']);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(!reference&&routes.has(pathname))file=path.join(root,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 res.setHeader('Cache-Control','no-cache');
 fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log((reference?'Reference':'PWA preview')+': http://127.0.0.1:'+port));
