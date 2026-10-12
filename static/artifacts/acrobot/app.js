'use strict';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),C=window.Acrobot;
let links=2,loadVersion=0;const models={};
function angles(){return links===2?[state[0],state[0]+state[1]]:state.slice(0,3)}
function fromAngles(q){return links===2?[q[0],C.wrap(q[1]-q[0]),0,0]:[...q,0,0,0]}
function preset(angle){return fromAngles(Array(links).fill(angle))}
let model=null,state=[Math.PI+Math.PI/12,0,0,0],pose=state.slice(),running=false,time=0,hold=0,torque=0,accumulator=0,last=null,drag=null,trail=[],eventUntil=0;
let width=800,height=520,scale=120,pivot=[400,260];
function joints(){const p=[pivot];for(const q of angles()){const last=p[p.length-1];p.push([last[0]+scale*Math.sin(q),last[1]+scale*Math.cos(q)])}return p}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=window.devicePixelRatio||1;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min((height-70)/(2*links),(width-60)/(2*links));pivot=[width/2,height/2];draw()}
function sliders(){const q=angles(),values=[C.wrap(q[0]-Math.PI),C.wrap(q[1]-q[0]),links===3?C.wrap(q[2]-q[1]):0];for(const [i,id] of ['upper','elbow','elbow2'].entries()){const value=Math.round(values[i]*180/Math.PI);$(id).value=value;$(id+'Value').textContent=value+'°'}}
function controls(){ $('run').textContent=running?'Pause':(time>0?'Resume':'Release');$('hold').textContent=hold.toFixed(1)+' s';$('time').textContent=time.toFixed(1);for(let i=0;i<links-1;i++){const u=links===2?torque:torque[i],limit=links===2?1:4,magnitude=Math.abs(u),positive=u>=0,suffix=i?'2':'';$('effortValue'+suffix).textContent=(magnitude<.005?'0.00':(positive?'+':'')+u.toFixed(2))+' N·m';$('effort'+suffix).style.width=magnitude/limit*50+'%';$('effort'+suffix).style.left=(positive?50:50-magnitude/limit*50)+'%';$('effort'+suffix).style.background=positive?'#476b70':'#9b633e'}const text=!model?'Loading policy…':!running?(time>0?'Paused':'Ready to release'):!$('motor').checked?'Motor off':hold>=10?'Balanced':hold>0?'Settling':'Finding balance';if($('status').textContent!==text)$('status').textContent=text; }
function setPose(s){eventUntil=0;$('event').style.display='none';running=false;state=s.slice();for(let i=links;i<state.length;i++)state[i]=0;pose=state.slice();time=hold=accumulator=0;torque=links===2?0:[0,0];trail=[];sliders();controls();draw()}
function event(text){$('event').textContent=text;eventUntil=performance.now()+2200;$('event').style.display='block'}
function draw(){ctx.clearRect(0,0,width,height);ctx.strokeStyle='#eeeeee';ctx.lineWidth=1;for(let x=width%32;x<width;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke()}for(let y=height%32;y<height;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
ctx.setLineDash([4,6]);ctx.strokeStyle='#bbbbbb';ctx.beginPath();ctx.moveTo(pivot[0],25);ctx.lineTo(pivot[0],height-25);ctx.stroke();ctx.setLineDash([]);
ctx.strokeStyle='#9b633e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pivot[0]-36,pivot[1]-links*scale);ctx.lineTo(pivot[0]+36,pivot[1]-links*scale);ctx.stroke();ctx.fillStyle='#666666';ctx.font='12px system-ui';ctx.fillText('Upright',pivot[0]+45,pivot[1]-links*scale+4);
if(trail.length>1){ctx.beginPath();for(let i=0;i<trail.length;i++){const p=trail[i];const x=pivot[0]+scale*p[0],y=pivot[1]+scale*p[1];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle='#55555525';ctx.lineWidth=2;ctx.stroke()}
const p=joints();ctx.lineCap='round';for(let i=0;i<links;i++){ctx.beginPath();ctx.moveTo(...p[i]);ctx.lineTo(...p[i+1]);ctx.lineWidth=12;ctx.strokeStyle=['#476b70','#999999','#9b633e'][i];ctx.stroke()}
for(let i=0;i<=links;i++){ctx.beginPath();ctx.arc(...p[i],i===0?8:11,0,Math.PI*2);ctx.fillStyle='#9b633e';ctx.fill();if(i){ctx.beginPath();ctx.arc(...p[i],18,0,Math.PI*2);ctx.strokeStyle='#77777740';ctx.lineWidth=1;ctx.stroke()}}
for(let i=1;i<links;i++)drawMotor(p[i],links===2?torque:torque[i-1],i);
if(!running){ctx.fillStyle='#666666';ctx.textAlign='center';ctx.fillText('Drag a joint to set the starting position',width/2,height-12);ctx.textAlign='left'}}
// Positive joint torque increases theta2: counterclockwise in our x=sin, y=cos view.
function drawMotor(elbow,u,index){
 const [x,y]=elbow,magnitude=Math.abs(u)/(links===2?1:4),color=u>=0?'#476b70':'#9b633e';
 ctx.beginPath();ctx.arc(x,y,15,0,2*Math.PI);ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle='#9b633e';ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle='#9b633e';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(links===2?'M':'M'+index,x,y+4);
 const labelX=Math.max(50,Math.min(width-50,x)),labelY=y+53;
 if(!running&&time===0){ctx.fillStyle='#fffffff0';ctx.fillRect(labelX-43,labelY-13,86,20);ctx.fillStyle='#9b633e';ctx.font='10px system-ui';ctx.fillText('Elbow motor'+(links===3?' '+index:''),labelX,labelY);}
 if(magnitude>=.005){
  const direction=u>0?-1:1,radius=29,start=-Math.PI/2,sweep=.35+magnitude*1.65*Math.PI,end=start+direction*sweep;
  ctx.beginPath();ctx.arc(x,y,radius,start,end,direction<0);ctx.strokeStyle=color;ctx.lineWidth=2+3*magnitude;ctx.stroke();
  const tx=x+radius*Math.cos(end),ty=y+radius*Math.sin(end),heading=end+direction*Math.PI/2,size=7+3*magnitude;
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-size*Math.cos(heading-.5),ty-size*Math.sin(heading-.5));ctx.lineTo(tx-size*Math.cos(heading+.5),ty-size*Math.sin(heading+.5));ctx.closePath();ctx.fillStyle=color;ctx.fill();
 }
 ctx.textAlign='left';
}
function animate(now){const elapsed=last===null?0:Math.min((now-last)/1000,.1);last=now;if(running&&model){accumulator+=elapsed*Number($('speed').value);while(accumulator>=.05){const r=(links===2?C:window.AcrobotThree).step(model,state,$('motor').checked);state=r.state;torque=r.torque;hold=r.allBalanced?hold+.05:r.holdTail;time+=.05;accumulator-=.05;if(!state.every(Number.isFinite)){running=false;event('Simulation stopped. Reset to try again.');break}trail.push([angles().reduce((v,q)=>v+Math.sin(q),0),angles().reduce((v,q)=>v+Math.cos(q),0)]);if(trail.length>150)trail.shift()}controls();draw()}if(now>eventUntil)$('event').style.display='none';requestAnimationFrame(animate)}
$('run').onclick=()=>{if(!model)return;running=!running;accumulator=0;controls();draw()};$('reset').onclick=()=>setPose(pose);
$('motor').onchange=()=>{torque=links===2?0:[0,0];event($('motor').checked?'Neural control on':'Motor off — free fall');controls();draw()};
$('kick').onclick=()=>{if(!model)return;if(links===2){state[2]=Math.min(4*Math.PI,state[2]+4);state[3]=Math.max(-9*Math.PI,state[3]-4)}else{state[3]+=4;state[4]-=4}hold=0;running=true;event('Kick applied');controls()};
for(const id of ['upper','elbow','elbow2'])$(id).oninput=()=>{const q1=Math.PI+Number($('upper').value)*Math.PI/180,q2=q1+Number($('elbow').value)*Math.PI/180,q3=q2+Number($('elbow2').value)*Math.PI/180;setPose(fromAngles([q1,q2,...(links===3?[q3]:[])]))};
for(const b of document.querySelectorAll('[data-preset]'))b.onclick=()=>setPose(preset({tilt:Math.PI+Math.PI/12,top:Math.PI,side:Math.PI/2,bottom:0}[b.dataset.preset]));
canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=joints();drag=1;for(let i=2;i<p.length;i++)if(Math.hypot(x-p[i][0],y-p[i][1])<Math.hypot(x-p[drag][0],y-p[drag][1]))drag=i;canvas.setPointerCapture(e.pointerId);setPose(state)};
canvas.onpointermove=e=>{if(!drag)return;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=joints(),origin=p[drag-1];const angle=Math.atan2(x-origin[0],y-origin[1]);const q=angles(),delta=C.wrap(angle-q[drag-1]);for(let i=drag-1;i<links;i++)q[i]+=delta;setPose(fromAngles(q))};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;pose=state.slice();draw()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){running=false;accumulator=0;controls()}last=null});
new ResizeObserver(resize).observe(canvas);sliders();controls();requestAnimationFrame(animate);
async function selectLinks(){
 const version=++loadVersion;links=Number($('links').value);model=null;$('run').disabled=$('kick').disabled=true;
 $('secondJoint').hidden=$('secondEffort').hidden=links!==3;
 $('elbowLabel').textContent=links===2?'Elbow bend':'First elbow bend';
 $('torqueLabel').textContent=links===2?'Elbow torque':'First elbow torque';
 $('torqueScale').textContent=links===2?'−1 ↻ clockwise · counterclockwise ↺ +1':'−4 ↻ clockwise · counterclockwise ↺ +4';
 setPose(preset(Math.PI+Math.PI/12));resize();
 try{const n=links;if(!models[n]){const r=await fetch(n===2?'./policy.json?v=1':'./policy-three-unified.bin?v=1');if(!r.ok)throw Error('Policy download failed');const p=n===2?await r.json():AcrobotThree.prepare(await r.arrayBuffer());if(n===2&&(p.centers?.length!==467||!(p.sigma>0)))throw Error('Invalid policy');models[n]=p}if(version!==loadVersion)return;model=models[n];$('run').disabled=$('kick').disabled=false;controls()}
 catch(e){if(version===loadVersion)$('status').textContent='Could not load policy. Select links to retry.';console.error(e)}
}
$('links').onchange=selectLinks;selectLinks();
