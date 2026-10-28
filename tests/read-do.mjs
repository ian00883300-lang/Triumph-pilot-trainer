import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const width of [390,768,1440]){
 const p=await b.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:8085',{waitUntil:'domcontentloaded'});await p.locator('#readDoBtn').click();
 assert.equal(await p.locator('#rdCount').inputValue(),'7');
 await p.clock.install();
 for(const n of [4,7,10]){
 await p.locator('#rdCount').fill(String(n));await p.locator('#rdMathEnabled').setChecked(n!==4);await p.locator('#rdStart').click();
 assert.equal(await p.locator('#rdList li').count(),n);const commands=await p.locator('#rdList li span').allTextContents();
 await p.clock.runFor(1200);await p.locator('#rdPause').click();const frozen=await p.locator('#rdTotal').textContent();
 await p.clock.runFor(5000);assert.equal(await p.locator('#rdTotal').textContent(),frozen);assert.ok(await p.locator('#rdComplete').isDisabled());
 if(n!==4){assert.ok(await p.locator('#rdMathSubmit').isDisabled());}
 await p.locator('#rdPause').click();
 if(n!==4){const q=await p.locator('#rdMathQuestion').textContent();const [a,op,c]=q.split(' ');const answer=op==='+'?+a + +c:op==='−'?a-c:a*c;await p.locator('#rdMathAnswer').fill(String(answer));await p.locator('#rdMathSubmit').click();assert.match(await p.locator('#rdMathFeedback').textContent(),/正確/);}
 for(let i=0;i<n;i++){await p.clock.runFor(1000);await p.locator('#rdComplete').click();}
 assert.deepEqual(await p.locator('#rdList li span').allTextContents(),commands);assert.equal(await p.locator('#rdList li.done').count(),n);
 const record=await p.evaluate(()=>JSON.parse(localStorage.getItem('triumph_read_do_last')));assert.equal(record.splitsMs.length,n);assert.ok(Math.abs(record.splitsMs.reduce((a,b)=>a+b,0)-record.totalMs)<1);assert.ok(record.totalMs<(n+4)*1000,`pause counted: ${record.totalMs}`);
 if(n!==4)assert.match(await p.locator('#rdSummary').textContent(),/心算 1 題正確／1 題已作答/);
 assert.ok(await p.locator('#rdDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await p.locator('#rdRestart').click();
 }
 await p.locator('#rdClose').click();await p.locator('#flightMemoryBtn').click();await p.locator('#fmGenerate').click();assert.equal(await p.locator('#fmCommandList li').count(),6);
 assert.deepEqual(errors,[]);await p.close();
}
await b.close();console.log('PASS: Read and Do 4/7/10 commands at 390/768/1440; pause excludes time, splits sum to total, math on/off and scoring, persistent commands, restart, legacy memory smoke.');
