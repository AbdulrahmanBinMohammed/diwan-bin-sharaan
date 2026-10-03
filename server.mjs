import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectRoot, basePath } from './config.mjs';
const types={'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export function createServer(root=path.join(projectRoot,'dist'), prefix=basePath){
  root=path.resolve(root);
  return http.createServer((req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
    if(prefix){
      if(pathname===prefix){res.writeHead(302,{Location:prefix+'/'});return res.end();}
      if(!pathname.startsWith(prefix+'/')){res.writeHead(404);return res.end();}
      pathname=pathname.slice(prefix.length);
    }
    let file=path.resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    try{
      if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
      const stat=fs.statSync(file);
      if(!stat.isFile())throw Error();
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      if(req.method==='HEAD')return res.end();
      fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
    }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('الصفحة غير موجودة');}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const server=createServer();
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'المنفذ 8794 مستخدم. افتح الموقع الجاري أو أغلق النسخة السابقة.':error.message);process.exitCode=1;});
  server.listen(8794,'127.0.0.1',()=>console.log('http://127.0.0.1:8794'+basePath+'/'));
}
