import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite } from './build.mjs';
import { projectRoot } from './config.mjs';
import { validatePoems } from './validate.mjs';
import { createServer } from './server.mjs';

const root = path.join(projectRoot, 'dist');
const source = fs.readFileSync(path.join(root, 'data.json'), 'utf8');
const data = JSON.parse(source);
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(f => f.isDirectory() ? walk(path.join(dir,f.name)) : [path.join(dir,f.name)]);
validatePoems(data);
assert.throws(() => validatePoems([...data, data[0]]));
assert.throws(() => validatePoems([{...data[0], id:'../bad'}]));
assert.throws(() => validatePoems([{...data[0], verses:[['شطر ناقص']]}]));
const build = base => buildSite({basePath:base,origin:'https://example.org'});
try {
  for (const base of ['', '/diwan-test']) {
    build(base);
    const pages = walk(root).filter(f => f.endsWith('.html'));
    assert.equal(pages.length,data.length+3,'يوجد مسار قديم أو صفحة ناقصة');
    for (const file of pages) {
      const html = fs.readFileSync(file,'utf8');
      assert.match(html, /lang="ar" dir="rtl"/);
      assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file);
      assert.match(html, /<meta name="description" content="[^"\n]+"/);
      assert.match(html, new RegExp('https://example.org'+base+'/'));
      assert.doesNotMatch(html,/البطاقة (undefined|null|None)/);
      for (const m of html.matchAll(/\b(?:href|src|action)="(\/[^"\s]*)"/g)) {
        const url = m[1].split(/[?#]/)[0];
        assert.ok(url.startsWith(base+'/'),url);
        let target=path.join(root,url.slice(base.length));
        if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
        assert.ok(fs.existsSync(target),file+' -> '+url);
      }
    }
    for(const p of data){
      const html=fs.readFileSync(path.join(root,'poems',p.id,'index.html'),'utf8');
      const pairs=[...html.matchAll(/<div class="hemistichs">(.*?)<\/div>/g)].map(m=>[...m[1].matchAll(/<span>(.*?)<\/span>/g)].map(s=>s[1]));
      assert.deepEqual(pairs,p.verses.map(v=>v.map(escape)),'تغير نص أو ترتيب الأبيات: '+p.id);
    }
    const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
    assert.deepEqual([...home.matchAll(/class="poem-card" href="[^"]*\/poems\/([^/]+)\//g)].map(m=>m[1]),['p04','p05','p14']);
    const server=createServer(root,base);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const origin='http://127.0.0.1:'+server.address().port;
      for(const route of ['/', '/index/', '/review/', ...data.map(p=>'/poems/'+p.id+'/')])assert.equal((await fetch(origin+base+route)).status,200);
      assert.equal((await fetch(origin+base+'/missing/')).status,404);
      assert.equal((await fetch(origin+base+'/%ZZ')).status,400);
      assert.equal((await fetch(origin+base+'/',{method:'POST'})).status,405);
      const head=await fetch(origin+base+'/data.json',{method:'HEAD'});
      assert.equal(head.status,200);assert.equal(await head.text(),'');
      if(base)assert.equal((await fetch(origin+'/index/')).status,404);
    }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    console.log('نجح فحص '+pages.length+' صفحة وروابطها وحفظ الأبيات: '+(base||'/'));
  }
  assert.equal(fs.readFileSync(path.join(root,'data.json'),'utf8'),source,'تغير محتوى القصائد أثناء الفحص');
} finally {
  buildSite();
}
