import {useEffect,useRef} from "react";
import {useSite} from "../kit";
// Actual ray-marched 3D geometry, camera and lighting, independent from client media.
const vertex=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const fragment=`precision mediump float;uniform vec2 size;uniform vec2 camera;uniform float time;uniform float variant;uniform vec3 accent;
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float scene(vec3 p){p.xz=turn(time*.16)*p.xz;p.yz=turn(.6)*p.yz;float ring=length(vec2(length(p.xz)-.78,p.y))-.19;float orb=length(p-vec3(.1,.58,0.))-.35;if(variant>1.5)return min(orb,min(length(p-vec3(-.55,-.3,.2))-.42,length(p-vec3(.6,-.2,-.2))-.29));if(variant>.5){p.xy=turn(.6+sin(time*.2)*.3)*p.xy;return min(length(vec2(length(p.xy)-.64,p.z))-.24,orb);}return min(ring,orb);}
void main(){vec2 uv=(gl_FragCoord.xy*2.-size)/size.y;vec3 ro=vec3(camera.x*.9,camera.y*.65,3.4);vec3 f=normalize(vec3(0.,.12,0.)-ro);vec3 r=normalize(cross(f,vec3(0.,1.,0.)));vec3 ray=normalize(f*1.7+uv.x*r+uv.y*cross(r,f));float t=0.;float hit=0.;vec3 p;
for(int i=0;i<56;i++){p=ro+ray*t;float d=scene(p);if(d<.003){hit=1.;break;}t+=d*.85;if(t>7.)break;}if(hit<.5){gl_FragColor=vec4(0.);return;}
vec2 e=vec2(.005,0.);vec3 n=normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));vec3 light=normalize(vec3(-2.,3.,4.));float rim=pow(1.-max(dot(n,-ray),0.),3.);float spec=pow(max(dot(reflect(-light,n),-ray),0.),30.);gl_FragColor=vec4(accent*(.22+max(dot(n,light),0.)*.8)+vec3(.85,.92,1.)*(spec*.95+rim*.5),1.);}`;
export function CinemaScene(){
 const {p,theme}=useSite();const ref=useRef<HTMLCanvasElement>(null);const c=p.site.presentation;const enabled=c?.scene3d!==false&&c?.motion!=="off";
 useEffect(()=>{
 const canvas=ref.current;if(!enabled||!canvas||typeof WebGLRenderingContext==="undefined")return;
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 const gl=canvas.getContext("webgl",{alpha:true,antialias:false,powerPreference:"low-power"});if(!gl)return;
 let raf=0,last=0,visible=true,disposed=false,elapsed=0,x=0,y=0;
 const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);return s;};
 const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);return;}
 gl.useProgram(program);gl.uniform1f(gl.getUniformLocation(program,"variant"),[...p.site.templateId].reduce((n,ch)=>n+ch.charCodeAt(0),0)%3);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,"p");gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const uSize=gl.getUniformLocation(program,"size"),uCamera=gl.getUniformLocation(program,"camera"),uTime=gl.getUniformLocation(program,"time"),uAccent=gl.getUniformLocation(program,"accent");const hex=/^#[0-9a-f]{6}$/i.test(theme.accent)?theme.accent:"#8756fa";gl.uniform3f(uAccent,parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255);
 const draw=(now:number)=>{raf=0;if(disposed||document.hidden||!visible||reduced.matches||gl.isContextLost())return;if(now-last>=40){elapsed+=Math.min(now-last,80)/1000;last=now;const size=Math.min(420,Math.round((canvas.clientWidth||240)*Math.min(devicePixelRatio||1,1.5)));if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);}gl.uniform2f(uSize,size,size);gl.uniform2f(uCamera,x,y);gl.uniform1f(uTime,c?.ambient===false?0:elapsed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.ready="true";}if(c?.ambient!==false)raf=requestAnimationFrame(draw);};
 const wake=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(draw);};const root=canvas.closest<HTMLElement>(".fc-site");const move=(e:PointerEvent)=>{if(c?.pointer===false||e.pointerType==="touch")return;const r=root?.getBoundingClientRect();if(r){x=(e.clientX-r.left)/r.width*2-1;y=1-e.clientY/innerHeight*2;wake();}};const scroll=()=>{y=Math.max(-1,Math.min(1,(innerHeight/2-canvas.getBoundingClientRect().top)/innerHeight));wake();};
 const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;}});observer.observe(canvas);root?.addEventListener("pointermove",move);document.addEventListener("scroll",scroll,{capture:true,passive:true});document.addEventListener("visibilitychange",wake);reduced.addEventListener("change",wake);wake();
 const lost=(e:Event)=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;canvas.dataset.ready="false";};canvas.addEventListener("webglcontextlost",lost);
 return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();root?.removeEventListener("pointermove",move);document.removeEventListener("scroll",scroll,true);document.removeEventListener("visibilitychange",wake);reduced.removeEventListener("change",wake);canvas.removeEventListener("webglcontextlost",lost);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);};
 },[enabled,c?.ambient,c?.pointer,theme.accent,p.site.templateId]);
 return enabled?<div className="fm-cinema-scene" aria-hidden="true"><div className="fm-cinema-fallback"/><canvas ref={ref} className="fm-cinema-canvas"/></div>:null;
}
