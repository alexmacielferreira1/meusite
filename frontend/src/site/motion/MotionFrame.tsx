import {useEffect,useRef,type ReactNode} from "react";
import {useSite} from "../kit";
/** CSS variables keep pointer and scroll independent, with no React render per frame. */
export function useFrameMotion() {
 const ref=useRef<HTMLDivElement>(null);const {p}=useSite();const cfg=p.site.presentation;
 useEffect(()=>{
  const el=ref.current;if(!el||cfg?.motion==="off"||typeof matchMedia!=="function")return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");const fine=matchMedia("(hover: hover) and (pointer: fine)");let frame=0,visible=true;
  const amount=cfg?.motion==="expressive"?1.5:0.65;
  const paint=()=>{frame=0;if(reduced.matches||!visible)return;const r=el.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(innerHeight/2-r.top-r.height/2)/innerHeight));el.style.setProperty("--scroll-y",`${progress*40*amount}px`);};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const move=(e:PointerEvent)=>{if(reduced.matches||!fine.matches||cfg?.pointer===false)return;const r=el.getBoundingClientRect();el.style.setProperty("--rx",`${-(e.clientY-r.top-r.height/2)/r.height*8*amount}deg`);el.style.setProperty("--ry",`${(e.clientX-r.left-r.width/2)/r.width*10*amount}deg`);};
  const reset=()=>{el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg");};
  const preference=()=>{if(reduced.matches){reset();el.style.setProperty("--scroll-y","0px");}else scroll();};
  const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)scroll();},{rootMargin:"100px"}):null;
  observer?.observe(el);document.addEventListener("scroll",scroll,{capture:true,passive:true});window.addEventListener("resize",scroll,{passive:true});el.addEventListener("pointermove",move);el.addEventListener("pointerleave",reset);reduced.addEventListener?.("change",preference);scroll();
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();document.removeEventListener("scroll",scroll,true);window.removeEventListener("resize",scroll);el.removeEventListener("pointermove",move);el.removeEventListener("pointerleave",reset);reduced.removeEventListener?.("change",preference);reset();el.style.removeProperty("--scroll-y");};
 },[cfg?.motion,cfg?.pointer]);return ref;
}
export function MotionFrame({children,className="",label}:{children:ReactNode;className?:string;label?:string}) {
 const ref=useFrameMotion();return <div ref={ref} className={`fm-frame ${className}`} role={label?"img":undefined} aria-label={label}><div className="fm-frame-layer">{children}</div></div>;
}
