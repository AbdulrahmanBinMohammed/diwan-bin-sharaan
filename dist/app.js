const basePath=document.documentElement.dataset.basePath||'';
const $=s=>document.querySelector(s);const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2500)}
function pref(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch{}}
if(pref('diwan-theme')==='dark')document.body.classList.add('dark');$('.theme').setAttribute('aria-pressed',String(document.body.classList.contains('dark')));$('.theme').onclick=()=>{document.body.classList.toggle('dark');$('.theme').setAttribute('aria-pressed',String(document.body.classList.contains('dark')));pref('diwan-theme',document.body.classList.contains('dark')?'dark':'light')};
async function copy(t,message='تم النسخ'){try{await navigator.clipboard.writeText(t);toast(message)}catch{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();let ok=document.execCommand('copy');a.remove();toast(ok?message:'تعذر النسخ، حدّد النص لنسخه')}}
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy,b.dataset.copySuccess));
if($('.verses')){let size=Math.min(44,Math.max(20,Number(pref('diwan-font'))||29));const set=()=>{$('.verses').style.setProperty('--verse-size',size+'px');pref('diwan-font',size)};set();$('#font-up').onclick=()=>{size=Math.min(44,size+2);set()};$('#font-down').onclick=()=>{size=Math.max(20,size-2);set()};$('#copy-link').onclick=()=>copy(location.href);$('#share').onclick=async()=>{const obj={title:document.title,url:location.href};if(navigator.share){try{await navigator.share(obj)}catch(e){if(e.name!=='AbortError')await copy(location.href)}}else await copy(location.href)}}
const norm=s=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g,' ').toLowerCase();
if($('#results'))fetch(basePath+'/data.json?v='+encodeURIComponent(document.documentElement.dataset.contentVersion||''),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const params=new URLSearchParams(location.search);$('#query').value=params.get('q')||'';function run(){const q=norm($('#query').value.trim()),scope=$('#scope').value;const found=data.map(p=>{const title=norm(p.title).includes(q),matching=p.verses.map((v,i)=>({v,i})).filter(x=>norm(x.v.join(' ')).includes(q));return{p,title,matching}}).filter(x=>(!q||(scope==='title'?x.title:scope==='verses'?x.matching.length:x.title||x.matching.length))).sort((a,b)=>Number(b.title)-Number(a.title));$('#result-count').textContent=`${found.length} نتيجة${q?' للبحث عن «'+$('#query').value+'»':''}`;$('#results').innerHTML=found.map(({p,matching})=>`<a class="poem-card" href="${basePath}/poems/${encodeURIComponent(p.id)}/${q&&matching.length?'#verse-'+(matching[0].i+1):''}"><div class="card-top">${p.status.includes('مراجعة')?'<span class="tag warn">يحتاج مراجعة</span>':''}<span class="ordinal">${escapeHtml((p.displayNumber ?? p.id.slice(1)))}</span></div><h3>${escapeHtml(p.title)}</h3><div class="excerpt">${(q&&matching.length?matching[0].v:p.verses[0]||[]).map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div><div class="card-foot"><span>${p.verses.length} أبيات<span class="card-source"> · ${p.source.type==='x'?'فيديو على X':p.source.type==='user'?'نص من صاحب المشروع':'البطاقة '+p.source.region}</span></span><span>اقرأ القصيدة ←</span></div></a>`).join('')||'<div class="empty">لم نجد نصًا مطابقًا. جرّب كلمة أخرى أو أزل التصفية.</div>';const sp=new URLSearchParams();if($('#query').value)sp.set('q',$('#query').value);history.replaceState(null,'',location.pathname+(sp.size?'?'+sp:''))}$('#search-form').onsubmit=e=>{e.preventDefault();run()};['#query','#scope'].forEach(s=>$(s).addEventListener(s==='#query'?'input':'change',run));run()}).catch(()=>{$('#results').textContent='تعذر تحميل البيانات. أعد تحميل الصفحة.'});

if(document.modelContext?.registerTool && document.querySelector('#search-form')){
  try{Promise.resolve(document.modelContext.registerTool({name:'search_diwan',title:'البحث في الديوان',description:'عرض نتائج البحث في عناوين القصائد وأبياتها باستخدام نموذج البحث المرئي.',inputSchema:{type:'object',properties:{query:{type:'string',maxLength:200}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async input=>{if(!input||typeof input.query!=='string'||input.query.length>200)throw new Error('نص البحث غير صالح');if(!document.querySelector('#result-count'))throw new Error('البحث غير جاهز');document.querySelector('#query').value=input.query;document.querySelector('#query').dispatchEvent(new Event('input',{bubbles:true}));return {summary:document.querySelector('#result-count').textContent,query:input.query}}})).catch(()=>{})}catch{}
}

// Verse cards are rendered locally; the original text is never rewritten.
if(document.querySelector('[data-verse-card]')){
  const dialog=document.createElement('dialog');
  dialog.className='verse-card-dialog';
  dialog.setAttribute('aria-labelledby','verse-card-title');
  dialog.innerHTML=`<div class="verse-card-header"><h2 id="verse-card-title">بطاقة مشاركة البيت</h2><button type="button" class="card-close" aria-label="إغلاق بطاقة المشاركة">×</button></div><p class="card-message" role="status">جارٍ تجهيز البطاقة…</p><img class="verse-card-preview" alt="" hidden><div class="verse-card-actions"><button type="button" class="card-download" disabled>حفظ الصورة</button><button type="button" class="card-share" disabled>مشاركة الصورة ↗</button></div>`;
  document.body.append(dialog);
  const preview=dialog.querySelector('img'), message=dialog.querySelector('.card-message'), save=dialog.querySelector('.card-download'), share=dialog.querySelector('.card-share');
  let file=null,imageUrl=null,request=0,opener=null;
  const close=()=>dialog.close();
  dialog.querySelector('.card-close').onclick=close;
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{request++;if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=null;file=null;preview.removeAttribute('src');opener?.focus();});
  const download=()=>{if(!file||!imageUrl)return;const a=document.createElement('a');a.href=imageUrl;a.download=file.name;document.body.append(a);a.click();a.remove();message.textContent='تم بدء حفظ الصورة';};
  save.onclick=download;
  share.onclick=async()=>{if(!file)return;try{await navigator.share({files:[file],title:'من أبيات ديوان بن شرعان'});}catch(e){if(e.name!=='AbortError')message.textContent='تعذرت المشاركة؛ يمكنك حفظ الصورة وإرسالها.';}};
  const wrap=(ctx,text,width)=>{const lines=[];let line='';for(const word of text.split(' ')){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>width){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);return lines;};
  document.querySelectorAll('[data-verse-card]').forEach(button=>button.onclick=async()=>{
    opener=button;const token=++request;file=null;save.disabled=share.disabled=true;share.hidden=true;preview.hidden=true;message.textContent='جارٍ تجهيز البطاقة…';dialog.showModal();
    try{
      await document.fonts.load('52px Diwan').catch(()=>{});await document.fonts.ready;if(token!==request)return;
      const verse=button.closest('.verse'),parts=[...verse.querySelectorAll('.hemistichs>span')].map(s=>s.textContent);
      const author=document.querySelector('.poem-heading>p').textContent;
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#f7f3e9';ctx.fillRect(0,0,1080,1080);
      ctx.fillStyle='#fffcf6';ctx.fillRect(42,42,996,996);ctx.strokeStyle='#a78249';ctx.lineWidth=2;ctx.strokeRect(42,42,996,996);
      ctx.lineWidth=1;ctx.strokeRect(57,57,966,966);
      for(const [x,y,sx,sy] of [[78,78,1,1],[1002,78,-1,1],[78,1002,1,-1],[1002,1002,-1,-1]]){ctx.beginPath();ctx.moveTo(x,y+50*sy);ctx.lineTo(x,y);ctx.lineTo(x+50*sx,y);ctx.stroke();}
      ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#183535';ctx.font='bold 48px Diwan, serif';ctx.fillText('ديوان بن شرعان',540,155);
      ctx.fillStyle='#9a7540';ctx.font='24px Tahoma, sans-serif';ctx.fillText('من أبيات الديوان',540,220);
      const ornament=y=>{ctx.strokeStyle='#a78249';ctx.beginPath();ctx.moveTo(410,y);ctx.lineTo(504,y);ctx.moveTo(576,y);ctx.lineTo(670,y);ctx.stroke();ctx.beginPath();ctx.moveTo(540,y-9);ctx.lineTo(549,y);ctx.lineTo(540,y+9);ctx.lineTo(531,y);ctx.closePath();ctx.stroke();};ornament(285);
      let size=58,lines,leading,total;
      do{ctx.font=`${size}px Diwan, serif`;lines=parts.map(s=>wrap(ctx,s,820));leading=size*1.65;total=lines.reduce((n,a)=>n+a.length,0)*leading+32;if(total<=380&&lines.flat().every(s=>ctx.measureText(s).width<=820))break;size-=2;}while(size>=24);
      ctx.fillStyle='#183535';let y=530-total/2+leading/2;for(const half of lines){for(const line of half){ctx.fillText(line,540,y);y+=leading;}y+=32;}
      ornament(790);ctx.fillStyle='#183535';let authorSize=30;do{ctx.font=`${authorSize}px Diwan, serif`;if(ctx.measureText('الشاعر / '+author).width<=850)break;authorSize--;}while(authorSize>18);ctx.fillText('الشاعر / '+author,540,863);
      if(button.dataset.cardNote){ctx.font='19px Tahoma, sans-serif';ctx.fillStyle='#67716c';ctx.fillText(button.dataset.cardNote,540,914);}
      ctx.direction='ltr';ctx.font='17px Tahoma, sans-serif';ctx.fillStyle='#67716c';ctx.fillText('abdulrahmanbinmohammed.github.io/diwan-bin-sharaan',540,965);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('image')),'image/png'));if(token!==request)return;
      file=new File([blob],`diwan-${location.pathname.split('/').filter(Boolean).pop()}-${verse.id}.png`,{type:'image/png'});
      if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(blob);preview.src=imageUrl;preview.alt=parts.join(' — ')+' — '+author;preview.hidden=false;save.disabled=false;
      const canShare=typeof navigator.canShare==='function'&&navigator.canShare({files:[file]});share.hidden=!canShare;share.disabled=!canShare;message.textContent='بطاقة مربعة عالية الجودة · 1080 × 1080';
    }catch{if(token===request)message.textContent='تعذر تجهيز البطاقة. أغلق النافذة وحاول مرة أخرى.';}
  });
}
