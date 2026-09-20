import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,pbkdf2Sync,createCipheriv,createDecipheriv} from 'node:crypto';
const source=process.argv[2];
if(!source)throw Error('Usage: node build.mjs /absolute/path/to/user_study');
await fs.mkdir('runtime',{recursive:true,mode:0o700});
await fs.mkdir('site/assets',{recursive:true});
let code;
try {code=(await fs.readFile('runtime/invite.txt','utf8')).trim();}
catch(e){if(e.code!=='ENOENT')throw e;code=randomBytes(20).toString('hex').toUpperCase().match(/.{1,8}/g).join('-');await fs.writeFile('runtime/invite.txt',code+'\n',{mode:0o600,flag:'wx'});}
const normalize=s=>s.toUpperCase().replace(/[\s-]/g,'');
const salt=randomBytes(16),iterations=600000,key=pbkdf2Sync(normalize(code),salt,iterations,32,'sha256');
const ivs=new Set();let files=0,bytes=0;
async function encrypt(data,name){
 const iv=randomBytes(12);if(ivs.has(iv.toString('hex')))throw Error('Duplicate IV');ivs.add(iv.toString('hex'));
 const cipher=createCipheriv('aes-256-gcm',key,iv),ct=Buffer.concat([cipher.update(data),cipher.final()]);
 const encrypted=Buffer.concat([iv,ct,cipher.getAuthTag()]);
 const check=createDecipheriv('aes-256-gcm',key,iv);check.setAuthTag(encrypted.subarray(-16));
 if(!Buffer.concat([check.update(ct),check.final()]).equals(data))throw Error('Roundtrip failed');
 const file=name||'assets/'+randomBytes(16).toString('hex')+'.bin';await fs.writeFile(path.join('site',file),encrypted);files++;bytes+=encrypted.length;return file;
}
const records=JSON.parse(await fs.readFile(path.join(source,'v3/delivery_manifest.json'))).records;
const descriptions=JSON.parse(await fs.readFile(path.join(source,'inputs/render_manifest.json'))).samples;
const names={mainline:'AESOP',director:'DIRECTOR-C',dance:'DanceCamera3D',ccd:'CCD',pulp_dit:'PulpMotion DiT',pulp_mar:'PulpMotion MAR'};
const catalog={version:1,samples:[]};let videos=0,posters=0;
for(const mode of ['given','joint']){
 const ids=[...new Set(records.filter(r=>r.mode===mode).map(r=>r.sample_id))];if(ids.length!==20)throw Error('Expected 20 samples');
 for(const id of ids){
  const d=descriptions.find(r=>r.mode===mode&&r.sample_id===id);if(!d)throw Error('Missing text');
  const sample={mode,id,human:d.human_text,camera:d.camera_text,duration:d.duration_seconds,methods:[]};
  const rows=records.filter(r=>r.mode===mode&&r.sample_id===id).sort((a,b)=>Object.keys(names).indexOf(a.method)-Object.keys(names).indexOf(b.method));
  const expected=mode==='given'?['mainline','director','dance','ccd']:['mainline','pulp_dit','pulp_mar'];
  if(JSON.stringify(rows.map(r=>r.method))!==JSON.stringify(expected))throw Error('Method mismatch');
  for(const r of rows){
   const method={name:names[r.method],exception:Boolean(r.exception),views:[]};
   for(const view of ['spatial','camera']){
    const base=path.join(source,'v3/review_preview/media',mode,id,r.method,view);
    method.views.push({label:view==='spatial'?'Global · 全局轨迹':'Projection · 相机画面',video:await encrypt(await fs.readFile(base+'.mp4')),poster:await encrypt(await fs.readFile(base+'.jpg'))});videos++;posters++;
   }sample.methods.push(method);
  }catalog.samples.push(sample);
 }
}
if(videos!==280||posters!==280)throw Error('Incomplete package');
await encrypt(Buffer.from(JSON.stringify(catalog)),'catalog.bin');
await fs.writeFile('site/config.json',JSON.stringify({version:1,salt:salt.toString('base64'),iterations,catalog:'catalog.bin'}));
await fs.writeFile('runtime/build-report.json',JSON.stringify({samples:40,videos,posters,encryptedFiles:files,bytes,roundtrip:'PASS'},null,2));
console.log(JSON.stringify({samples:40,videos,posters,encryptedFiles:files,bytes,roundtrip:'PASS'}));
