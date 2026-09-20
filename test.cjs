const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const base=process.env.TEST_URL||'http://127.0.0.1:18010/';const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',...(process.env.TEST_PROXY?{proxy:{server:process.env.TEST_PROXY,bypass:'127.0.0.1'}}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);if(await page.locator('video').count())throw Error('Content visible before unlock');
await page.locator('#code').fill('invalid');await page.locator('#enter').click();await page.waitForFunction(()=>document.querySelector('#gate-status').textContent.includes('不正确'));
await page.locator('#code').fill(fs.readFileSync('runtime/invite.txt','utf8').trim());await page.locator('#enter').click();await page.waitForSelector('.sample');
const checked=[];
for(const mode of ['given','joint']){await page.locator('[data-mode='+mode+']').click();const expected=mode==='given'?160:120;if(await page.locator('.sample').count()!==20||await page.locator('video').count()!==expected)throw Error('Counts');
await page.locator('.sample-head button').first().click();await page.waitForFunction(()=>[...document.querySelector('.sample').querySelectorAll('video')].every(v=>v.currentTime>.2),{},{timeout:60000});
await page.locator('[data-action=pause]').click();await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.paused));
await page.screenshot({path:'runtime/'+mode+'.png'});checked.push({mode,samples:20,videos:expected,playback:true});}
await page.setViewportSize({width:390,height:844});if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Mobile overflow');
await page.locator('#lock').click();await page.waitForSelector('#gate');if(await page.locator('video').count())throw Error('Lock failed');
await page.locator('#code').fill(fs.readFileSync('runtime/invite.txt','utf8').trim());await page.locator('#enter').click();await page.waitForSelector('.sample');
if(errors.length)throw Error(errors.join(';'));await browser.close();console.log(JSON.stringify({status:'PASS',wrong_code_rejected:true,lock:true,mobile:true,checked}));})().catch(e=>{console.error(e);process.exit(1)});
