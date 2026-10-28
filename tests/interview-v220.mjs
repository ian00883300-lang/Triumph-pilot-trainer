import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const changes=JSON.parse(fs.readFileSync('v220-interview-changes.json','utf8'));
const baselineTotal=changes.baseline_total;
const url=process.env.TEST_URL || 'http://127.0.0.1:8085/';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || '/usr/bin/chromium'});
const checks=[];
try {
 const context=await browser.newContext({serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.TRIUMPH_V220_QA);
 const bankNow=await page.evaluate(()=>bank);
 assert.equal(bankNow.length,baselineTotal+6);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bankNow.filter(q=>!/^INTERVIEW (EN|CN)$/.test(q.cat)))).digest('hex'),changes.baseline_non_interview_sha256);
 checks.push('Non-interview cards remain exactly unchanged');
 for(const patch of changes.patches){const actual=bankNow[patch.index];for(const [key,value] of Object.entries(patch.values))assert.deepEqual(actual[key],value,`${patch.index}/${key}`);if(patch.values.q&&patch.values.q!==patch.question)assert.equal(actual._storageKey,`${patch.cat}|${patch.question}`);}
 assert.ok(!bankNow.some(q=>/^INTERVIEW (EN|CN)$/.test(q.cat)&&q.s.includes('To make the answer interview-ready')));
 assert.equal(bankNow.filter(q=>q.needsPersonalization).length,6);
 checks.push('All 57 targeted changes, six additions, template labels and removed instructional tails verified');
 // Test every corrected/new card through the existing display, at three widths.
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const index of [...changes.patches.map(p=>p.index),...changes.added.map((_,i)=>baselineTotal+i)]){
   await page.evaluate(i=>{loadQuestion(bank[i],false);showAnswer();},index);
   assert.equal(await page.locator('#question').innerText(),bankNow[index].q);
   const normalize=s=>s.replace(/【[^】]*】/g,'').replace(/\s+/g,' ').trim();
   assert.ok(normalize(await page.locator('#suggested').innerText()).includes(normalize(bankNow[index].s).slice(0,45)),`${index} main display`);
   if(bankNow[index].cat==='INTERVIEW EN'){const zh=bankNow[index].cn.split(/【中文(?:完整翻譯|參考答案|翻譯)】/).at(-1);assert.ok(normalize(await page.locator('#chinese').innerText()).includes(normalize(zh).slice(0,35)),`${index} Chinese display`);}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${index} overflow`);
  }
  checks.push(`All corrected/new cards render without overflow at ${width}px`);
 }
 // The renamed salary question must still read the old persistent favourite/note key.
 const renamed=changes.patches.find(p=>p.index===1513);const oldKey=renamed.cat+'|'+renamed.question;
 await page.evaluate(({i,key})=>{state.favs[key]=true;state.notes[key]='v220 persistence probe';save();loadQuestion(bank[i],false);}, {i:1513,key:oldKey});
 assert.equal(await page.locator('#notes').inputValue(),'v220 persistence probe');
 await page.reload();await page.waitForFunction(()=>window.TRIUMPH_V220_QA);await page.evaluate(()=>loadQuestion(bank[1513],false));
 assert.equal(await page.locator('#notes').inputValue(),'v220 persistence probe');assert.equal(await page.evaluate(key=>Boolean(state.favs[key]),oldKey),true);
 checks.push('Renamed question keeps the old favourite and note after reload');
 // Use an isolated six-card pool to exercise the actual Daily Test renderer.
 await page.evaluate(questions=>{const keep=bank.filter(q=>questions.includes(q.q));bank.splice(0,bank.length,...keep);},changes.added.map(q=>q.q));
 await page.locator('#dailyTestLaunch').click();await page.locator('#dtClearAll').click();
 await page.locator('#dtBankGrid label[data-type="pilot"]').click();await page.locator('#dtBankGrid label[data-type="interview_cn"]').click();
 await page.locator('#dtCount').fill('6');await page.locator('#dtStart').click();
 const seen=new Set();
 for(let i=0;i<6;i++){
  const question=await page.locator('#dtQuestion').innerText();const card=changes.added.find(q=>q.q===question);assert.ok(card,question);seen.add(question);
  await page.locator('#dtRevealModel').click();assert.ok((await page.locator('#dtFeedback').innerText()).includes(card.s.slice(0,45)));
  await page.locator('#dtSelfRating button[data-rating="3"]').click();await page.locator('#dtNext').click();
 }
 assert.equal(seen.size,6);checks.push('All six added English/Chinese cards work through Daily Test and self-assessment');

 assert.deepEqual(errors,[]);checks.push('No browser runtime errors');
 const result={version:'v220',date:'2026-10-28',total:bankNow.length,patched:changes.patches.length,added:changes.added.length,english:bankNow.filter(q=>q.cat==='INTERVIEW EN').length,chinese:bankNow.filter(q=>q.cat==='INTERVIEW CN').length,checks};
 fs.writeFileSync('v220-qa.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 await context.close();
} finally {await browser.close();}
