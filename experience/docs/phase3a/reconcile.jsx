import * as T from 'three';
import React from 'react';
import {createRoot,extend} from '@react-three/fiber';
import PiBoard from '../../src/pi/PiBoard';
import {TRACE_ANCHOR,CIRCUIT_SCALE,CIRCUIT_ENTRY,toCircuit,gpio,traces} from '../../src/pi/layout';

extend(T);
const scene=new T.Scene();scene.background=new T.Color('#071B21');scene.fog=new T.FogExp2('#071B21',.007);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
document.querySelector('#scene').append(renderer.domElement);
const camera=new T.PerspectiveCamera(58,1280/720,.01,260);
scene.add(new T.HemisphereLight('#aacbd5','#264c3d',2));scene.add(new T.AmbientLight('#acc6c3',1.4));
const key=new T.DirectionalLight('#b8dce4',3);key.position.set(30,45,20);scene.add(key);
const root=createRoot(renderer.domElement);
await root.configure({gl:renderer,scene,camera,frameloop:'never',size:{width:1280,height:720},dpr:1});
root.render(<group position={TRACE_ANCHOR.map(n=>-n*CIRCUIT_SCALE)} scale={CIRCUIT_SCALE}><PiBoard reducedMotion /></group>);
await new Promise(resolve=>{const check=()=>scene.getObjectByName('pi-board-custom-geometry')?resolve():requestAnimationFrame(check);check();});
await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const attachments=new T.Group();attachments.name='proposed-attached-structures';scene.add(attachments);
const material=(color,emissive)=>new T.MeshStandardMaterial({color,roughness:.65,metalness:.25,emissive:emissive||'#000000',emissiveIntensity:emissive?1.2:0});
const dark=material('#16252b'),metal=material('#687e7d'),copper=material('#BB8555'),paper=material('#d6c4a1'),warm=material('#F2B978','#F2B978'),signal=material('#68DBC6','#68DBC6');
function box(pos,size,mat,parent=attachments){const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.position.fromArray(pos);parent.add(m);return m;}
// Attached canopy abuts the west edge x=18 of the unchanged processor.
box([14.5,5.8,-16],[7,.5,12],dark);box([11.2,2.9,-16],[.35,5.8,12],dark);box([14.5,.5,-16],[7,.4,12],metal);box([14.5,2.9,-21.8],[7,5.8,.35],dark);
box([13.5,1.65,-18],[3,2.3,2],dark);box([13.5,2.4,-16.95],[1.6,.75,.06],warm);
for(let i=0;i<3;i++){const knob=new T.Mesh(new T.CylinderGeometry(.23,.23,.25,16),copper);knob.rotation.x=Math.PI/2;knob.position.set(12.6+i*.85,1.5,-16.85);attachments.add(knob);}
box([13.5,5.35,-17],[.15,.12,3.6],warm);const lamp=new T.PointLight('#F2B978',75,18,2);lamp.position.set(15,3,-15);attachments.add(lamp);
// A proposed surface-mounted copper spur connects to existing branch trace 6.
function line(points,y,w,mat){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],m=box([(a[0]+b[0])/2,y,(a[1]+b[1])/2],[w,.04,Math.hypot(b[0]-a[0],b[1]-a[1])],mat);m.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);}}
line([[16,-11],[16,-7],[20,-4],[30,-4]],.4,.12,signal);
const notebook=new T.Group();notebook.name='proposed-notebook-in-socket-gap';notebook.position.set(112,1.2,-12);attachments.add(notebook);
box([0,0,0],[5,.6,3.6],material('#795038'),notebook);box([0,.35,0],[4.9,.1,3.5],paper,notebook);
for(let i=0;i<4;i++)box([0,.08+i*.06,0],[4.94,.018,3.54],paper,notebook);
const page=box([1.4,.6,.55],[1.6,.035,1.6],paper,notebook);page.rotation.z=-.15;page.rotation.x=-.2;
box([.8,.44,0],[.13,.035,3.65],copper,notebook);
const poses={A:{position:[...CIRCUIT_ENTRY.position],target:[36,5,-28]},J:{position:[98,2.6,-5],target:[112,1.65,-12]},B:{position:[98,2.6,-13],target:[112,1.65,-12]},C:{position:[16,2.6,-5],target:[14,2.6,-17]}};
const mapped=(name,source,position,size)=>({name,source,boardPosition:position,circuitPosition:toCircuit(position),...(size?{boardSize:size,circuitSize:size.map(n=>n*100)}:{})});
window.studyManifest={revision:'PCB reconciliation v2',units:'production circuit units',transform:{formula:'(boardPoint - TRACE_ANCHOR) * CIRCUIT_SCALE',TRACE_ANCHOR,CIRCUIT_SCALE},authoritativeSource:'src/pi/PiBoard.tsx + src/pi/layout.ts; actual PiBoard rendered without geometry edits',landmarks:[mapped('processor','PiBoard Solid',[-.08,.073,-.04],[.42,.14,.36]),mapped('processor lid','PiBoard Solid',[-.08,.147,-.04],[.32,.008,.27]),...[[.72,.3,.36,.3,.24],[.72,-.06,.36,.3,.24],[.69,-.405,.4,.27,.28]].map(([x,z,w,d,h],i)=>mapped('socket '+i,'PiBoard Socket shell center',[x,h/2,z],[w,h,d])),...gpio.map((p,i)=>mapped('GPIO '+i,'layout.gpio['+i+']',p.position,p.size))],traces:traces.map((t,i)=>({source:'layout.traces['+i+']',boardPoints:t.points,circuitPoints:t.points.map(([x,z])=>toCircuit([x,.003,z])),width:t.width*100})),attachments:{laboratory:{canopyCenter:[14.5,5.8,-16],canopySize:[7,.5,12],reason:'processor base is y=0.3; no existing walk-in void. New attached canopy abuts west edge x=18; no CPU carving or lifting.'},notebook:{center:[112,1.2,-12],size:[5,.6,3.6],socketGapZ:[-15,-9]},spur:{points:[[16,-11],[16,-7],[20,-4],[30,-4]],reason:'proposed attached surface conductor, connects to existing branch trace at z=-4; not an original trace'}},handoff:{entry:CIRCUIT_ENTRY,note:'A preserves exact entry position, but looks right after arrival. Original handoff orientation must be retained first, then user-controlled rotation; no camera jump.'},poses,navigationProposal:{existingControllerLimitation:'Current circuitPose only follows a narrow central corridor. These routes require a future interruptible branch controller; not implemented or approved here.',main:[[0,10],[0,-11],[4,-11],[12,-11],[16,-7],[16,-5]],optionalNotebook:[[4,-11],[12,-4],[62,-4],[72,6],[98,6],[98,-5],[98,-13]],note:'Main laboratory route and optional notebook route diverge; the notebook is not a prerequisite. Paths are proposals; no automatic itinerary.'},reveal:{from:'J',to:'B',distance:8,forwardDisplacement:0,note:'pure lateral shift in Z while looking east; multiple samples and frustum checks in visibility-sweep.json'}};
const labels={A:[['ENTRY TRACE',[0,.35,0]],['PROCESSOR / UNMOVED',[39,12,-28]],['ATTACHED WORKSHOP',[14,3,-15]]],B:[['PAPER IN SOCKET GAP',[112,1.8,-12]],['EXISTING SOCKET',[119,14,-30]]],C:[['PHYSICAL CONTROLS',[13.5,1.5,-16.7]],['ATTACHED CANOPY',[14.5,5.8,-13]]]};
function draw(pose,frame){camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld(true);scene.updateMatrixWorld(true);renderer.render(scene,camera);document.querySelector('#labels').innerHTML='';for(const [text,p]of labels[frame]||[]){const v=new T.Vector3(...p).project(camera);if(v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1)continue;const e=document.createElement('div');e.className='label';e.style.left=(v.x*.5+.5)*1280+'px';e.style.top=(-v.y*.5+.5)*720+'px';e.textContent=text;document.querySelector('#labels').append(e);}document.querySelector('#caption').textContent=frame+' / PCB-ALIGNED RECONCILIATION / ACTUAL BOARD GEOMETRY';}
window.renderFrame=f=>draw(poses[f],f);
window.renderPose=p=>draw(p,null);
window.studyManifest.navigationProposal.main=[[0,10],[0,-11],[4,-11],[4,-7],[16,-7],[16,-5]];
window.studyManifest.navigationProposal.optionalNotebook=[[4,-11],[12,-4],[69,-4],[69,27],[98,27],[98,-5],[98,-13]];
window.studyManifest.navigationProposal.note+=' Optional route detours south of ribbon connector (whose Z extent is -4 to 24), rather than following a trace underneath it.';
const samples=[[-2,.42,-1.4],[0,.42,-1.4],[2,.42,-1.4],[-2,.42,0],[0,.42,0],[2,.42,0],[-2,.42,1.4],[0,.42,1.4],[2,.42,1.4],[1.5,.8,1]];
function visibility(pose){draw(pose,null);const origin=new T.Vector3(...pose.position),ray=new T.Raycaster();return samples.map((offset,i)=>{const point=new T.Vector3(...offset).add(notebook.position),projected=point.clone().project(camera),inFrustum=Math.abs(projected.x)<=1&&Math.abs(projected.y)<=1&&projected.z>=-1&&projected.z<=1;ray.set(origin,point.clone().sub(origin).normalize());const hit=ray.intersectObjects(scene.children,true).find(h=>h.object.isMesh);let isNotebook=false;for(let obj=hit?.object;obj;obj=obj.parent)if(obj===notebook)isNotebook=true;return {sample:i,point:point.toArray(),inFrustum,notebookFirstHit:isNotebook,visible:inFrustum&&isNotebook,occluder:!isNotebook&&hit?hit.object.position.toArray():null};});}
window.visibilitySweep=()=>{const rows=Array.from({length:33},(_,i)=>{const t=i/32,pose={position:poses.J.position.map((v,j)=>T.MathUtils.lerp(v,poses.B.position[j],t)),target:poses.B.target};const points=visibility(pose);return {t,distance:t*8,camera:pose.position,visibleCount:points.filter(p=>p.visible).length,total:points.length,points};});const arrival=visibility(poses.A);return {method:'33 evenly spaced camera positions over 8 circuit units, 10 notebook samples each; actual rendered meshes, nearest ray hit plus frustum',arrival,rows,firstPartial:rows.find(r=>r.visibleCount>0)?.distance,firstMajority:rows.find(r=>r.visibleCount>=5)?.distance,visibleInterval:rows.filter(r=>r.visibleCount>0).map(r=>r.distance)};};
window.routeChecks=()=>{scene.updateMatrixWorld(true);return Object.fromEntries(['main','optionalNotebook'].map(name=>{const points=window.studyManifest.navigationProposal[name],segments=points.slice(1).map((p,i)=>{const a=new T.Vector3(points[i][0],2.6,points[i][1]),b=new T.Vector3(p[0],2.6,p[1]),length=a.distanceTo(b),ray=new T.Raycaster(a,b.clone().sub(a).normalize(),.01,length-.01),hit=ray.intersectObjects(scene.children,true).find(h=>h.object.isMesh);return {from:a.toArray(),to:b.toArray(),length,blocked:!!hit,...(hit?{distance:hit.distance,object:hit.object.position.toArray()}:{})};});return [name,{method:'centerline segment rays at camera height 2.6; not swept-volume collision certification',length:segments.reduce((n,s)=>n+s.length,0),segments}];}));};
draw(poses.A,'A');window.ready=true;
