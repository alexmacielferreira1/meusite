import {useEffect,useRef} from "react";
import {useSite} from "../kit";
/** Enhance only media; preserve the existing model DOM, transforms and layouts. */
export function LegacyMotion() {
 const ref=useRef<HTMLSpanElement>(null);const {p}=useSite();const c=p.site.presentation;
 useEffect(()=>{
  const root=ref.current?.closest<HTMLElement>(".fc-site");if(!root||p.site.templateId.startsWith("motion-")||c?.motion==="off"||typeof matchMedia!=="function")return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");const fine=matchMedia("(hover: hover) and (pointer: fine)");
  const media=[...root.querySelectorAll<HTMLElement>('[style*="background-image"], img')].filter(el=>!el.closest('[role="dialog"],footer,nav')).slice(0,24);
  let raf=0;const amount=c?.motion==="expressive"?38:18;
  const paint=()=>{raf=0;if(reduced.matches)return;for(const el of media){const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;el.style.setProperty("--legacy-y",`${Math.max(-amount,Math.min(amount,(innerHeight/2-r.top-r.height/2)/innerHeight*amount))}px`);}};
  const scroll=()=>{if(!raf)raf=requestAnimationFrame(paint);};
  const move=(event:PointerEvent)=>{if(reduced.matches||!fine.matches||c?.pointer===false)return;const el=event.currentTarget as HTMLElement;const r=el.getBoundingClientRect();el.style.setProperty("--legacy-x",`${(event.clientX-r.left-r.width/2)/r.width*amount}px`);el.style.setProperty("--legacy-r",`${(event.clientX-r.left-r.width/2)/r.width*2.5}deg`);el.style.setProperty("--legacy-scale","1.025");};
  const leave=(event:PointerEvent)=>{const el=event.currentTarget as HTMLElement;el.style.setProperty("--legacy-x","0px");el.style.setProperty("--legacy-r","0deg");el.style.setProperty("--legacy-scale","1");};
  const pref=()=>{if(reduced.matches)media.forEach(el=>{el.style.removeProperty("--legacy-x");el.style.removeProperty("--legacy-y");el.style.removeProperty("--legacy-r");el.style.removeProperty("--legacy-scale");});else scroll();};
  media.slice(0,1).forEach(el=>el.classList.add("fm-legacy-hero"));
  media.forEach(el=>{el.classList.add("fm-legacy-media");el.addEventListener("pointermove",move);el.addEventListener("pointerleave",leave);});
  const sections=[...root.querySelectorAll<HTMLElement>("section")];
  const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&!reduced.matches)e.target.classList.add("fm-entered");}),{threshold:0.05}):null;
  sections.forEach(el=>observer?.observe(el));document.addEventListener("scroll",scroll,{capture:true,passive:true});reduced.addEventListener?.("change",pref);scroll();
  return()=>{cancelAnimationFrame(raf);observer?.disconnect();document.removeEventListener("scroll",scroll,true);reduced.removeEventListener?.("change",pref);sections.forEach(el=>el.classList.remove("fm-entered"));media.forEach(el=>{el.classList.remove("fm-legacy-media","fm-legacy-hero");el.style.removeProperty("--legacy-r");el.style.removeProperty("--legacy-scale");el.style.removeProperty("--legacy-y");el.style.removeProperty("--legacy-x");el.removeEventListener("pointermove",move);el.removeEventListener("pointerleave",leave);});};
 },[p.site.templateId,p.works,c?.motion,c?.pointer]);
 return <span ref={ref} hidden aria-hidden="true"/>;
}
