import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const bundle=await build({entryPoints:[path.join(root,'study.js')],bundle:true,write:false,format:'iife',minify:true});
const html=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#071B21;color:#d3e3de;font:13px Arial}#scene{position:relative;width:1280px;height:720px}#labels{position:absolute;inset:0;pointer-events:none}.label{position:absolute;border-left:2px solid #f2b978;padding:6px 10px;background:#071b21d9;font:11px monospace;white-space:nowrap;transform:translate(8px,-100%)}header{position:absolute;top:24px;left:28px;font:11px monospace;letter-spacing:2px;color:#9dbcb9}#caption{position:absolute;bottom:26px;left:28px;padding:12px;background:#071b21dd;border-left:2px solid #68dbc6}</style><div id="scene"></div><div id="labels"></div><header>TRACE CANYON / SPATIAL DESIGN STUDY / NOT APPLICATION FOOTAGE</header><div id="caption"></div><script>${bundle.outputFiles[0].text}</script>`;
await writeFile(path.join(root,'study.html'),html);
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const videoFrames=[];
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
page.on('pageerror',e=>{throw e;});await page.setContent(html);await page.waitForFunction(()=>window.ready);
for(const frame of ['A','B','C']){await page.evaluate(f=>window.renderFrame(f),frame);await page.screenshot({path:path.join(root,`frame-${frame}.png`)});}
await writeFile(path.join(root,'scene-manifest.json'),JSON.stringify(await page.evaluate(()=>window.studyManifest),null,2)+'\n');
await writeFile(path.join(root,'sightlines.json'),JSON.stringify(await page.evaluate(()=>window.checkSightlines()),null,2)+'\n');
const frames=path.join(root,'frames');await mkdir(frames,{recursive:true});
for(let i=0;i<160;i++){await page.evaluate(t=>window.renderTime(t),i/10);videoFrames.push(await page.screenshot({type:'jpeg',quality:88}));if(i%40===0)console.log('Rendered',i,'/ 160');}
}finally{await browser.close();}
const ffmpeg=path.join(process.env.LOCALAPPDATA,'ms-playwright','ffmpeg-1013','ffmpeg-win64.exe');
const result=spawnSync(ffmpeg,['-y','-f','image2pipe','-vcodec','mjpeg','-r','10','-i','pipe:0','-c:v','libvpx-vp9','-b:v','0','-crf','34',path.join(root,'trace-canyon-animatic.webm')],{input:Buffer.concat(videoFrames),maxBuffer:16*1024*1024});
if(result.status!==0)throw new Error(result.stderr);console.log('Frames and 16-second animatic saved.');
