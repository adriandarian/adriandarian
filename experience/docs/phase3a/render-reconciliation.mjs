import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'reconciled');await mkdir(out,{recursive:true});
const bundle=await build({entryPoints:[path.join(root,'reconcile.jsx')],bundle:true,write:false,format:'esm',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#071B21;color:#d3e3de;font:13px Arial}#labels{position:absolute;inset:0;pointer-events:none}.label{position:absolute;border-left:2px solid #f2b978;padding:6px 10px;background:#071b21e6;font:11px monospace;white-space:nowrap;transform:translate(8px,-100%)}header{position:absolute;top:24px;left:28px;font:11px monospace;letter-spacing:2px}#caption{position:absolute;bottom:26px;left:28px;padding:12px;background:#071b21dd}</style><div id="scene"></div><div id="labels"></div><header>TRACE CANYON / PCB RECONCILIATION / DESIGN STUDY ONLY</header><div id="caption"></div><script type="module">${bundle.outputFiles[0].text}</script>`;
await writeFile(path.join(root,'reconciled-study.html'),html);
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>console.error(e));await page.setContent(html);await page.waitForFunction(()=>window.ready,{},{timeout:60000});
for(const frame of ['A','B','C']){await page.evaluate(f=>window.renderFrame(f),frame);await page.screenshot({path:path.join(out,`frame-${frame}.png`)});}
await writeFile(path.join(out,'scene-manifest.json'),JSON.stringify(await page.evaluate(()=>window.studyManifest),null,2)+'\n');
const sweep=await page.evaluate(()=>window.visibilitySweep());await writeFile(path.join(out,'visibility-sweep.json'),JSON.stringify(sweep,null,2)+'\n');console.log(JSON.stringify({arrivalVisible:sweep.arrival.filter(p=>p.visible).length,firstPartial:sweep.firstPartial,firstMajority:sweep.firstMajority,rows:sweep.rows.map(r=>[r.distance,r.visibleCount])}));
const checks=await page.evaluate(()=>window.routeChecks());await writeFile(path.join(out,'route-checks.json'),JSON.stringify(checks,null,2)+'\n');
assert.equal(sweep.arrival.filter(p=>p.visible).length,0,'notebook hidden from arrival');
assert.ok(sweep.firstPartial<=4,'partial reveal by halfway');
assert.ok(sweep.rows.filter(r=>r.distance>=4.5).every(r=>r.visibleCount>=8),'at least 8/10 samples visible over final 3.5 units');
assert.ok(Object.values(checks).every(c=>c.segments.every(s=>!s.blocked)),'route centerlines avoid mesh intersections');
const strips=[];
for(const [name,index] of [['start',0],['early',8],['middle',16],['late',24],['end',32]]){const row=sweep.rows[index];await page.evaluate(({position,target})=>window.renderPose({position,target}),{position:row.camera,target:[112,1.65,-12]});await page.evaluate(({distance,visibleCount})=>document.querySelector('#caption').textContent=`LATERAL SHIFT ${distance} / 8 UNITS — ${visibleCount}/10 VISIBLE SAMPLES`,row);const file=path.join(out,`sweep-${name}.png`);await page.screenshot({path:file});strips.push({image:(await readFile(file)).toString('base64'),distance:row.distance,count:row.visibleCount});}
await page.setContent('<style>body{margin:0;background:#071B21;color:#d3e3de;font:14px Arial}h3{font-size:16px;padding:12px;margin:0}main{display:flex}figure{margin:0;width:256px}img{width:256px}figcaption{padding:8px}</style><h3>Same notebook, same sockets / 8-unit lateral movement / no forward displacement</h3><main>'+strips.map(s=>`<figure><img src="data:image/png;base64,${s.image}"><figcaption>${s.distance}/8 units — ${s.count}/10 samples visible</figcaption></figure>`).join('')+'</main>');
await page.screenshot({path:path.join(out,'visibility-strip.png'),clip:{x:0,y:0,width:1280,height:230}});
console.log('Reconciliation checks passed: arrival occlusion, broad reveal interval, route centerlines.');
}finally{await browser.close();}
