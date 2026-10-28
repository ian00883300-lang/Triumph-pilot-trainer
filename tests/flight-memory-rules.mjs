import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const start=html.indexOf(' function random(a)');
const end=html.indexOf(' function open(){',start);
const ctx=vm.createContext({window:{}});vm.runInContext(html.slice(start,end),ctx);
const coverage=new Set();
for(let n=3;n<=10;n++)for(let run=0;run<1000;run++){
 const commands=vm.runInContext(`generate(${n})`,ctx);assert.equal(commands.length,n);
 let last=null;const speeds=[];
 for(const text of commands){
 let type,m;
 if(m=text.match(/^(Climb|Descend) ([\d,]+) feet from current altitude\.$/)){
 type='alt';assert.ok([1000,1500,2000,2500].includes(Number(m[2].replace(',',''))));coverage.add(m[1]);
 }else if(m=text.match(/^Turn (left|right) (\d+) degrees with (\d+) degrees of bank$/)){
 type='turn';assert.ok([30,45,60,90].includes(+m[2]));assert.ok([10,15,20,25,30].includes(+m[3]));coverage.add('turn'+m[2]);coverage.add('bank'+m[3]);
 }else{
 type='spd';m=text.match(/^(Increase SPD|Reduce IAS) to (\d+) kt$/);assert.ok(m,text);
 const up=m[1]==='Increase SPD';const speed=+m[2];assert.ok(speed%10===0&&speed>=(up?260:180)&&speed<=(up?300:240));speeds.push(up);coverage.add(m[1]+speed);
 }
 assert.notEqual(type,last);last=type;
 }
 assert.ok(speeds.length<=2);if(speeds.length===2)assert.notEqual(speeds[0],speeds[1]);
}
for(const v of ['Climb','Descend','turn30','turn45','turn60','turn90','bank10','bank30','Increase SPD260','Increase SPD300','Reduce IAS180','Reduce IAS240'])assert.ok(coverage.has(v),v);
console.log('PASS: 8,000 sequences, lengths 3–10, all ranges, no adjacent same type, at most two opposite speed commands, boundary coverage, inline syntax.');
