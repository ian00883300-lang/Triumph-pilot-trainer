import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture=process.env.TRIUMPH_UPGRADE_FIXTURE;if(!fixture)throw Error('Set TRIUMPH_UPGRADE_FIXTURE to an isolated v219 fixture directory; never point it at the checkout.');
assert.notEqual(fs.realpathSync(fixture),fs.realpathSync('.'));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/usr/bin/chromium'});
try{
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8086/');await page.waitForFunction(()=>window.TRIUMPH_BUILD_VERSION==='v219');
 await page.waitForFunction(async()=>Boolean(await (await caches.open('triumph-pilot-v219')).match(new URL('./index.html',location.href).href)));
 await page.evaluate(()=>{const q=bank[1513];state.favs[keyOf(q)]=true;state.notes[keyOf(q)]='upgrade persistence probe';save();});
 for(const file of ['index.html','sw.js','version.json'])fs.copyFileSync(file,fixture+'/'+file);
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;await registration.update();});
 await page.reload();
 await page.waitForFunction(async()=>{const response=await(await caches.open('triumph-pilot-v220')).match(new URL('./index.html',location.href).href);return Boolean(response&&response.headers.get('X-Triumph-Build')==='v220');});
 await page.reload();await page.waitForFunction(()=>window.TRIUMPH_BUILD_VERSION==='v220');
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.TRIUMPH_V220_QA);
 await page.evaluate(()=>loadQuestion(bank[1513],false));assert.equal(await page.locator('#notes').inputValue(),'upgrade persistence probe');
 assert.ok(await page.evaluate(()=>state.favs[keyOf(bank[1513])]));assert.ok((await page.evaluate(()=>caches.keys())).includes('triumph-pilot-v219'));
 assert.deepEqual(errors,[]);await context.close();
 const qa={version:'v220',date:'2026-10-28',checks:['v219 → v220 service-worker update and offline reload preserve old favourites, notes and fallback cache']};fs.writeFileSync('v220-upgrade-qa.json',JSON.stringify(qa,null,2)+'\n');console.log('PASS old-version cache upgrade, v220 offline loading and persisted favourites/notes');
}finally{await browser.close();}
