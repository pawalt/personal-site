/* Three absolute link angles, passive base, two equal/opposite elbow torques. */
(function(root){
'use strict';
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
// Row-major float32 weights; one state-only dense network for both motors.
function prepare(buffer){
 if(buffer.byteLength!==531458*4)throw Error('Invalid unified policy size');
 const weights=new Float32Array(buffer);if(!weights.every(Number.isFinite))throw Error('Invalid policy weights');
 let offset=0;const layers=[];
 for(const [input,output] of [[9,512],[512,512],[512,512],[512,2]]){
  const w=weights.subarray(offset,offset+input*output);offset+=input*output;
  const b=weights.subarray(offset,offset+output);offset+=output;
  layers.push({input,output,w,b,values:new Float64Array(output)});
 }
 const m={layers};m.anchor=Array.from(forward(m,[0,0,0,-1,-1,-1,0,0,0]));return m;
}
function forward(m,z){
 for(let l=0;l<m.layers.length;l++){
  const {input,output,w,b,values}=m.layers[l];
  for(let j=0;j<output;j++){let v=b[j],base=j*input;for(let k=0;k<input;k++)v+=w[base+k]*z[k];values[j]=l===3?v:Math.tanh(v)}
  z=values;
 }
 return z;
}
function policy(m,s){
 const z=[...s.slice(0,3).map(Math.sin),...s.slice(0,3).map(Math.cos),...s.slice(3).map(v=>v/8)];
 const y=forward(m,z);return [4*Math.tanh(y[0]-m.anchor[0]),4*Math.tanh(y[1]-m.anchor[1])];
}
function derivative(s,u){
 const c=[[3.25,1.5,.5],[1.5,2.25,.5],[.5,.5,1.25]],g=[24.5,14.7,4.9],force=[-u[0],u[0]-u[1],u[1]];
 const rows=c.map((r,i)=>[...r.map((v,j)=>v*Math.cos(s[i]-s[j])),force[i]-g[i]*Math.sin(s[i])-r.reduce((v,x,j)=>v+x*Math.sin(s[i]-s[j])*s[j+3]**2,0)]);
 for(let k=0;k<3;k++){
  let pivot=k;for(let i=k+1;i<3;i++)if(Math.abs(rows[i][k])>Math.abs(rows[pivot][k]))pivot=i;
  [rows[k],rows[pivot]]=[rows[pivot],rows[k]];const d=rows[k][k];for(let j=k;j<4;j++)rows[k][j]/=d;
  for(let i=0;i<3;i++)if(i!==k){const f=rows[i][k];for(let j=k;j<4;j++)rows[i][j]-=f*rows[k][j]}
 }
 return [...s.slice(3),...rows.map(r=>r[3])];
}
function physics(s,u,h=.0025){const add=(a,b,k)=>a.map((v,i)=>v+k*b[i]),a=derivative(s,u),b=derivative(add(s,a,h/2),u),c=derivative(add(s,b,h/2),u),d=derivative(add(s,c,h),u);return s.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6)}
function balanced(s){return s.slice(0,3).every(q=>-Math.cos(q)>Math.cos(Math.PI/18))&&s.slice(3).every(v=>Math.abs(v)<.5)}
function step(m,s,enabled=true){const u=enabled?policy(m,s):[0,0];let x=s,hold=0;for(let i=0;i<20;i++){x=physics(x,u);hold=balanced(x)?hold+.0025:0}return {state:x,torque:u,holdTail:hold,allBalanced:hold>.049999}}
const api={prepare,policy,derivative,physics,balanced,step};root.AcrobotThree=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
