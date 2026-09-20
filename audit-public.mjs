import fs from 'node:fs/promises';
const files=[...(await fs.readdir('site')).filter(f=>f!=='assets'&&!f.startsWith('.')),...(await fs.readdir('site/assets')).map(f=>'assets/'+f)];
let next=0,bytes=0;
await Promise.all(Array.from({length:6},async()=>{while(next<files.length){const name=files[next++];const expected=await fs.readFile('site/'+name);let error;for(let n=0;n<3;n++){try{const r=await fetch('https://ripemangobox.github.io/aesop-results/'+name,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const actual=Buffer.from(await r.arrayBuffer());if(!actual.equals(expected))throw Error('Different content: '+name);bytes+=actual.length;error=null;break;}catch(e){error=e;}}if(error)throw error;}}));
const result={status:'PASS',public_files:files.length,bytes,byte_equality:true};await fs.writeFile('runtime/public-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
