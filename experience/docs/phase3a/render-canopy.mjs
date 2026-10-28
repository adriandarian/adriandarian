import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'canopy-refinement');await mkdir(out,{recursive:true});
const bundle=await build({entryPoints:[path.join(root,'canopy-study.jsx')],bundle:true,write:false,format:'esm',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'}});
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#071B21;color:#d3e3de;font:13px Arial}.label{position:absolute;border-left:2px solid #f2b978;padding:6px 10px;background:#071b21e6;font:11px monospace;white-space:nowrap;transform:translate(8px,-100%)}header{position:absolute;top:24px;left:28px;font:11px monospace;letter-spacing:2px}#caption{position:absolute;bottom:26px;left:28px;padding:12px;background:#071b21dd}</style><div id="scene"></div><div id="labels"></div><header>TRACE CANYON / OPEN CANOPY REFINEMENT / DESIGN ONLY</header><div id="caption"></div><script type="module">${bundle.outputFiles[0].text}</script>`;
await writeFile(path.join(root,'canopy-study.html'),html);
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});let pageError;page.on('pageerror',e=>pageError=e);await page.setContent(html);await page.waitForFunction(()=>window.ready,{},{timeout:60000});if(pageError)throw pageError;
const manifest=await page.evaluate(()=>window.studyManifest),baseline=JSON.parse(await readFile(path.join(root,'reconciled/scene-manifest.json'),'utf8'));
for(const field of ['transform','landmarks','traces','navigationProposal','reveal'])assert.deepEqual(manifest[field],baseline[field],field+' unchanged from 446f8a7');
for(const field of ['notebook','spur'])assert.deepEqual(manifest.attachments[field],baseline.attachments[field],field+' unchanged');
assert.deepEqual(manifest.poses.A,baseline.poses.A);assert.deepEqual(manifest.poses.B,baseline.poses.B);
await writeFile(path.join(out,'scene-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
for(const frame of ['A','B','C','close','side']){await page.evaluate(f=>window.renderFrame(f),frame);await page.screenshot({path:path.join(out,`frame-${frame}.png`)});}
const sweep=await page.evaluate(()=>window.visibilitySweep()),oldSweep=JSON.parse(await readFile(path.join(root,'reconciled/visibility-sweep.json'),'utf8'));
assert.deepEqual(sweep.rows.map(r=>r.visibleCount),oldSweep.rows.map(r=>r.visibleCount));assert.equal(sweep.arrival.filter(p=>p.visible).length,0);
const routes=await page.evaluate(()=>window.routeChecks());assert.ok(Object.values(routes).every(r=>r.segments.every(s=>!s.blocked)));
const host=await page.evaluate(()=>window.hostVisibility());assert.ok(Object.values(host).every(v=>v.inFrustum&&v.firstHitOriginalBoard),'original processor sample visible in workshop, close and side views');
await writeFile(path.join(out,'validation.json'),JSON.stringify({baseline:'446f8a7',unchangedFields:['transform','landmarks','traces','navigationProposal','reveal','notebook','spur','poses.A','poses.B'],notebookVisibleCounts:sweep.rows.map(r=>r.visibleCount),arrivalVisible:0,routeCenterlinesClear:true,hostVisibility:host,limitations:'Point rays and centerlines, not body clearance or working navigation. No timing or performance claim.'},null,2)+'\n');
const sequence=[];
for(const sample of manifest.approachStudy.samples){await page.evaluate(p=>window.renderPose(p),sample.pose);await page.evaluate(text=>document.querySelector('#caption').textContent=text,sample.name+' / '+sample.note);const name=`approach-${sample.name}.png`;await page.screenshot({path:path.join(out,name)});sequence.push({image:(await readFile(path.join(out,name))).toString('base64'),name:sample.name,note:sample.note});}
await page.setContent('<style>body{margin:0;background:#071b21;color:#d3e3de;font:13px Arial}h3{margin:0;padding:12px;font-size:16px}main{display:grid;grid-template-columns:repeat(4,320px)}figure{margin:0}img{width:320px;display:block}figcaption{padding:8px;min-height:42px}</style><h3>A-to-C spatial sequence / exact handoff first, deliberate orientation turn, then trace approach / no prescribed timing</h3><main>'+sequence.map(s=>`<figure><img src="data:image/png;base64,${s.image}"><figcaption>${s.name}<br>${s.note}</figcaption></figure>`).join('')+'</main>');
await page.screenshot({path:path.join(out,'approach-sequence.png'),clip:{x:0,y:0,width:1280,height:550}});
console.log('PASS: PCB/notebook/routes match baseline; 33-position visibility counts unchanged; processor sample visible in C/close/side; centerlines clear.');
}finally{await browser.close();}
