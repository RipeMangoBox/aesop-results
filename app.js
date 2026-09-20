'use strict';
const $=s=>document.querySelector(s), enc=new TextEncoder();
let key=null,catalog=null,mode='given',epoch=0,observer=null;
const urls=new Map(),pending=new Map();let active=0;const queue=[];
async function limited(fn){if(active>=6)await new Promise(r=>queue.push(r));active++;try{return await fn();}finally{active--;queue.shift()?.();}}
async function fetchBytes(file){const r=await fetch(file,{signal:AbortSignal.timeout(60000),cache:file==='config.json'?'no-store':'default'});if(!r.ok)throw Error('下载失败，请重试 ('+r.status+')');return new Uint8Array(await r.arrayBuffer());}
async function decrypt(file,k=key){const b=await fetchBytes(file);return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},k,b.slice(12));}
async function asset(file,mime){if(urls.has(file))return urls.get(file);if(pending.has(file))return pending.get(file);const p=limited(async()=>{const url=URL.createObjectURL(new Blob([await decrypt(file)],{type:mime}));urls.set(file,url);return url;});pending.set(file,p);try{return await p;}finally{pending.delete(file);}}
function node(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function videos(scope=$('#samples')){return [...scope.querySelectorAll('video')];}
async function ready(v){if(!v.getAttribute('src'))v.src=await asset(v.dataset.file,'video/mp4');v.parentElement.querySelector('button').hidden=true;}
async function action(type,scope=$('#samples')){
 const vs=videos(scope),ticket=++epoch;
 if(type==='toggle')type=vs.some(v=>!v.paused)?'pause':'play';
 if(type!=='play'){vs.forEach(v=>{v.pause();if(type==='reset'&&v.getAttribute('src'))v.currentTime=0;});$('#status').textContent=type==='reset'?'已归零':'已暂停';return;}
 $('#status').textContent='正在加载 '+vs.length+' 段视频…';
 try{await Promise.all(vs.map(ready));if(ticket!==epoch)return;const results=await Promise.allSettled(vs.map(v=>v.play()));const failed=results.filter(r=>r.status==='rejected').length;$('#status').textContent=failed?'部分视频被浏览器暂停，请点击单独播放。':'正在播放 '+vs.length+' 段视频';}
 catch(e){if(ticket===epoch)$('#status').textContent='加载未完成，请重试。'+e.message;}
}
function render(){
 ++epoch;videos().forEach(v=>v.pause());observer?.disconnect();$('#samples').replaceChildren();$('#samples').className=mode;$('#status').textContent='';
 $('#scope').textContent=mode==='given'?'评估对象：generated camera（Human 为给定条件）':'评估对象：joint Human–Camera（人物与相机均生成）';
 document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.textContent=(b.dataset.mode==='given'?'Given-Human':'Joint')+' · '+catalog.samples.filter(s=>s.mode===b.dataset.mode).length+' samples';});
 observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;observer.unobserve(e.target);asset(e.target.dataset.poster,'image/jpeg').then(url=>{if(e.target.isConnected)e.target.poster=url;}).catch(()=>{});}),{rootMargin:'500px'});
 catalog.samples.filter(s=>s.mode===mode).forEach((s,i)=>{
  const row=node('section',null,'sample'),head=node('div',null,'sample-head');head.append(node('h2',String(i+1).padStart(2,'0')+' · '+s.id));
  const play=node('button','播放／暂停这一组');play.onclick=()=>action('toggle',row);head.append(play);row.append(head);
  const prompts=node('div',null,'prompts');prompts.append(node('p','Human: '+s.human),node('p','Camera: '+s.camera),node('span',s.duration.toFixed(3)+' s','duration'));row.append(prompts);
  const grid=node('div',null,'grid');
  s.methods.forEach(m=>{const card=node('article',null,'method');card.append(node('h3',m.name));
   m.views.forEach(view=>{card.append(node('div',view.label,'view-label'));const wrap=node('div',null,'video-wrap'),v=node('video');v.controls=true;v.muted=true;v.loop=true;v.playsInline=true;v.preload='none';v.dataset.file=view.video;v.dataset.poster=view.poster;v.setAttribute('aria-label',s.id+' '+m.name+' '+view.label);
    const load=node('button','播放','load-video');load.onclick=async()=>{load.disabled=true;try{await ready(v);await v.play();}catch(e){load.hidden=false;$('#status').textContent=e.message;}finally{load.disabled=false;}};
    v.onerror=()=>{$('#status').textContent='媒体加载失败，请刷新后重新输入邀请码。';};wrap.append(v,load);card.append(wrap);observer.observe(v);
   });if(m.exception)card.append(node('small','Global 使用独立观察视角（v3 标注的例外）。','exception'));grid.append(card);
  });row.append(grid);$('#samples').append(row);
 });
}
$('#unlock').addEventListener('submit',async e=>{e.preventDefault();$('#enter').disabled=true;$('#gate-status').textContent='正在解锁…';
 try{
  if(!crypto.subtle)throw Error('请使用支持 HTTPS 的现代浏览器。');
  const conf=JSON.parse(new TextDecoder().decode(await fetchBytes('config.json')));
  const material=await crypto.subtle.importKey('raw',enc.encode($('#code').value.toUpperCase().replace(/[\s-]/g,'')),'PBKDF2',false,['deriveKey']);
  const k=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:Uint8Array.from(atob(conf.salt),c=>c.charCodeAt(0)),iterations:conf.iterations},material,{name:'AES-GCM',length:256},false,['decrypt']);
  catalog=JSON.parse(new TextDecoder().decode(await decrypt(conf.catalog,k)));key=k;$('#code').value='';$('#gate').hidden=true;$('#review').hidden=false;$('#lock').hidden=false;render();
 }catch(e){$('#gate-status').textContent=e.name==='OperationError'?'邀请码不正确，请检查后重试。':e.message;}finally{$('#enter').disabled=false;}
});
$('#lock').onclick=()=>{videos().forEach(v=>v.pause());for(const url of urls.values())URL.revokeObjectURL(url);location.reload();};
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render();});
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
document.addEventListener('keydown',e=>{if(e.code==='Space'&&key&&!['INPUT','TEXTAREA','BUTTON','VIDEO'].includes(e.target.tagName)){e.preventDefault();action('toggle');}});
