import * as T from 'three';

// Design-only maquette: fixed landmark transforms, three camera positions.
const scene = new T.Scene();
scene.background = new T.Color('#071B21');
scene.fog = new T.FogExp2('#071B21', .015);
const renderer = new T.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setSize(1280,720); renderer.setPixelRatio(1);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.querySelector('#scene').append(renderer.domElement);
const camera = new T.PerspectiveCamera(58,1280/720,.1,180);
scene.add(new T.HemisphereLight('#91b9c4','#163326',1.15));
scene.add(new T.AmbientLight('#a5c7c8',.9));
const key=new T.DirectionalLight('#98c7da',3.5);key.position.set(10,30,-12);scene.add(key);
const rim=new T.DirectionalLight('#b87c42',1.5);rim.position.set(-15,15,12);scene.add(rim);
const mat=(color,metalness=.3,roughness=.6,emissive)=>new T.MeshStandardMaterial({color,metalness,roughness,emissive:emissive||'#000000',emissiveIntensity:emissive?2:0});
const pcb=mat('#17443B',.3,.77), copper=mat('#BB8555',.8,.34), ceramic=mat('#16252b',.5,.45), metal=mat('#738586',.85,.3), dark=mat('#071319'), signal=mat('#68DBC6',.3,.3,'#68DBC6'), warm=mat('#F2B978',.1,.7,'#F2B978'), paper=mat('#d2bb8e',0,.9);
function box(x,y,z,w,h,d,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
function cylinder(x,y,z,r,h,m){const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,20),m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
box(0,-.5,-15,65,1,110,pcb);
// Shared trace network: the main route is unmistakable without arrows.
const routes=[[[1,24],[1,-3],[-1,-7],[-1,-17],[-7,-21]],[[1,-3],[9,-8],[11,-18]],[[1,-17],[6,-23],[6,-43]],[[11,-18],[15,-22],[15,-40]]];
function line(points,y,width,m){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i];const length=Math.hypot(bx-ax,bz-az);const mesh=box((ax+bx)/2,y,(az+bz)/2,width,.035,length,m);mesh.rotation.y=Math.atan2(bx-ax,bz-az);}}
for(const route of routes){line(route,.035,.65,copper);line(route,.065,.075,signal);}
for(let i=0;i<8;i++)line([[-2-i*.45,20],[-2-i*.45,-2],[-5-i*.45,-7],[-5-i*.45,-22]],.015,.045,copper);
// Monumental processor and its physical support contacts.
box(-11,10,-24,19,8,31,ceramic);
box(-11,14.1,-24,18.5,.25,30.5,metal);
for(let i=0;i<12;i++){const z=-37+i*2.3;if(z < -24 || z > -15)box(-1.7,3,z,.45,5.8,.9,copper);box(-20.3,3,z,.45,5.8,.9,copper);}
for(let i=0;i<9;i++)box(-11,14.4,-36+i*3,17,.35,.12,dark);
// Workshop: an open recess under the overhang, facing the trace.
box(-9,2.5,-20,.5,5,8,dark);box(-6,4.9,-20,6,.3,8,ceramic);
box(-6,.35,-20,6,.5,8,metal);box(-6,2.5,-24,6,5,.35,ceramic);
box(-5.8,4.6,-20,.12,.12,6.3,warm);
box(-7.6,1.5,-20,1.5,2.1,5,ceramic);
box(-6.7,2,-19.8,.07,.8,1.2,warm);
for(let i=0;i<3;i++){const knob=cylinder(-6.6,1.6,-18.3-i*.75,.19,.25,copper);knob.rotation.z=Math.PI/2;}
line([[-7,-21],[-5,-21],[-5,-18],[-1,-17]],.65,.08,signal);
const lamp=new T.PointLight('#F2B978',95,19,2);lamp.position.set(-4,3,-19);scene.add(lamp);
// Right connector screens the notebook from A, but not the lateral B camera.
for(let i=0;i<2;i++){box(7.2+i*4.1,2.8,-6,3.7,5.6,3,metal);box(7.2+i*4.1,2.6,-4.45,2.9,3.4,.15,dark);for(let j=0;j<5;j++)box(6.1+i*4.1+j*.5,1.3,-4.3,.1,.5,.15,copper);}
// Bound paper object behind the connectors. A lifted corner is geometry.
box(10.2,1.3,-14,3.3,.65,4.7,mat('#744c32'));
box(10.2,1.66,-14,3.12,.13,4.5,paper);
const corner=box(11.4,1.92,-12.5,.8,.04,1.25,paper);corner.rotation.z=-.25;corner.rotation.x=-.25;
box(10.8,1.78,-13.9,.13,.05,4.8,copper);
for(let i=0;i<4;i++)box(10.2,1.72,-15.2+i*.42,1.8,.018,.025,copper);
// GPIO forest and capacitor silhouettes, all fixed across views.
for(let row=0;row<2;row++)for(let i=0;i<16;i++){const z=-12-i*2.7;box(19+row*2.1,1,z,1.5,2,1.4,dark);box(19+row*2.1,8,z,.42,12,.42,copper);}
for(const [x,z,r,h] of [[-7,9,1.8,7],[15,-29,3,17],[9,-40,2.2,13],[27,-16,3.5,20],[-24,-9,2.6,14]]){cylinder(x,h/2,z,r,h,ceramic);cylinder(x,h+.08,z,r*.93,.16,metal);box(x,h+.2,z,r*1.2,.03,.09,dark);}
for(let i=0;i<22;i++){const x=-22+(i%5)*1.2,z=-42-Math.floor(i/5)*2;box(x,.65,z,.75,1.3,1.4,ceramic);}
const pulse=cylinder(1,.18,12,.19,.18,signal);
const poses={A:{position:[3,2.5,19],target:[-2,5,-20]},B:{position:[15.8,3.1,-4.5],target:[10.2,1.8,-14]},C:{position:[.2,2.6,-17.5],target:[-6.5,2.9,-20]}};
window.studyManifest={units:'concept metres; not production board coordinates',landmarks:{processor:{center:[-11,10,-24],size:[19,8,31]},laboratory:[-6,2.5,-20],notebook:[10.2,1.3,-14],connectors:[[7.2,2.8,-6],[11.3,2.8,-6]],gpio:[19,8,-12]},poses,routes,duration:16};
function mixPose(a,b,t){t=t*t*(3-2*t);return {position:a.position.map((v,i)=>T.MathUtils.lerp(v,b.position[i],t)),target:a.target.map((v,i)=>T.MathUtils.lerp(v,b.target[i],t))};}
function poseAt(t){if(t<2)return poses.A;if(t<6)return mixPose(poses.A,poses.B,(t-2)/4);if(t<8)return poses.B;if(t<10)return mixPose(poses.B,poses.A,(t-8)/2);if(t<14)return mixPose(poses.A,poses.C,(t-10)/4);return poses.C;}
const annotations={A:[['01 / FOLLOW THE TRACE',[1,.1,1]],['02 / WARM RECESS',[-4,3,-19]],['03 / GPIO FOREST',[19,10,-21]]],B:[['01 / PAPER REVEALED',[10.5,1.9,-13]],['02 / CONNECTOR OCCLUDER',[9,4,-6]]],C:[['01 / PHYSICAL SIGNAL CONTROLS',[-6.5,1.8,-19]],['02 / PROCESSOR OVERHANG',[-4,8,-20]]]};
function draw(pose,t,frame){camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();pulse.position.z=18-(t*4)%33;renderer.render(scene,camera);document.querySelector('#labels').innerHTML='';if(frame){for(const [label,pos] of annotations[frame]){const v=new T.Vector3(...pos).project(camera);if(v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1)continue;const el=document.createElement('div');el.className='label';el.style.left=`${(v.x*.5+.5)*1280}px`;el.style.top=`${(-v.y*.5+.5)*720}px`;el.textContent=label;document.querySelector('#labels').append(el);}}
document.querySelector('#caption').textContent=frame?({A:'A / ARRIVAL — main trace and distant warmth',B:'B / HIDDEN DISCOVERY — lateral movement reveals paper',C:'C / LABORATORY — workshop under the same processor'}[frame]):`${t.toFixed(1)}s / ${t<2?'Arrival hold':t<6?'Lateral exploration':t<8?'Notebook reveal':t<10?'Return to junction':t<14?'Follow trace toward workshop':'Laboratory reveal'}`;}
window.renderFrame=(frame)=>draw(poses[frame],frame==='A'?0:frame==='B'?6:14,frame);
window.renderTime=(t)=>draw(poseAt(t),t,null);
window.checkSightlines=()=>{scene.updateMatrixWorld(true);const ray=new T.Raycaster();return Object.fromEntries(Object.entries(poses).map(([name,p])=>{const origin=new T.Vector3(...p.position),target=new T.Vector3(10.8,1.82,-13.9);ray.set(origin,target.clone().sub(origin).normalize());const hit=ray.intersectObjects(scene.children,false)[0];return [name,{notebookSampleDistance:origin.distanceTo(target),firstSurfaceDistance:hit?.distance,firstSurface:hit?.object.position.toArray(),sampleOccluded:!!hit&&hit.distance<origin.distanceTo(target)-.25}];}));};
window.renderFrame('A');window.ready=true;
