import {PhotoImg} from "./PhotoLayer";
import {useState} from "react";
import {MOTION_DESIGNS} from "../../data/motionDesigns";
import {useSite} from "../kit";
import {Page,Box,Nav,usePage,ContactButton,Socials,firstSentence,fit,roleText} from "./shared";
import {Extras} from "./Extras";
import {MotionFrame} from "../motion/MotionFrame";
import {Art} from "../motion/Art";
import {showsGallery,isHidden} from "./blocks";
import "../motion/motion.css";

type Design=typeof MOTION_DESIGNS[number];
function SafeArt({src,kind,label}:{src?:string;kind:string;label?:string}) {
 const [failed,setFailed]=useState(false);
 if(!src||failed||src.startsWith("grad:")||!/^https?:\/\/|^\/(?!\/)|^data:image\/(png|jpeg|webp);/i.test(src))return <Art kind={kind}/>;
 return <PhotoImg src={src} alt={label??""} loading="lazy" onError={()=>setFailed(true)} className="fm-image"/>;
}
function MotionModel({design:d}:{design:Design}) {
 const {p,theme}=useSite();const {pr,head,visual,openWork,mail}=usePage();const c=p.site.presentation??{};
 const lead=visual.find(w=>w.featured)??visual[0];const heroImage=pr.heroImage||(d.layout==="portrait"?pr.photo:lead?.cover)||pr.photo;
 const title=pr.heroTitle||pr.headline||pr.name;const gallery=c.gallery??"model";
 const classes=`fm-site fm-model-${d.id} fm-layout-${d.layout} fm-artwork-${d.art} fm-gallery-${gallery} fm-density-${c.density??"comfortable"} fm-border-${c.frame??"shadow"} fm-radius-${theme.radius} ${head}`;
 const copy=<div className="fm-copy"><p className="fm-kicker">{pr.heroKicker||roleText(pr,"short")}</p><h1 style={fit(title)}>{title}</h1>{pr.bio&&<p className="fm-intro">{firstSentence(pr.bio)}</p>}{mail&&<ContactButton className="fm-cta">{pr.ctaLabel||"Vamos criar juntos"} <span aria-hidden>↗</span></ContactButton>}</div>;
 const art=<MotionFrame className="fm-hero-art"><SafeArt key={heroImage} src={heroImage} kind={d.art} label={heroImage===pr.photo?`Retrato de ${pr.name}`:lead?.title}/><span className="fm-art-glow" aria-hidden/></MotionFrame>;
 const projects=visual.slice(0,showsGallery(p,p.works)?6:250);
 return <Page bg={d.bg} ink={d.ink} className={classes}>
  <header><Box className="fm-header"><a href="#inicio" className="fm-name">{pr.name}</a><Nav items={[["Destaques","#motion-itens",visual.length>0],["Contato","#contato",true]]}/></Box></header>
  <section id="inicio" className="fm-hero"><Box className="fm-hero-grid">{["stage","sculpture"].includes(d.layout)?<>{art}{copy}</>:<>{copy}{art}</>}</Box></section>
  {pr.manifesto&&!isHidden(p,"about")&&<section className="fm-manifesto"><Box><p>{pr.manifesto}</p></Box></section>}
  {visual.length>0&&<section id="motion-itens" className="fm-work-section"><Box><div className="fm-section-heading"><h2>{d.layout==="editorial"?"Histórias selecionadas":d.layout==="cinematic"?"Seleção especial":d.layout==="audio"?"Opções selecionadas":"Destaques selecionados"}</h2><span>{String(visual.length).padStart(2,"0")}</span></div>
   <div className="fm-projects" tabIndex={d.layout==="horizontal"||gallery==="rail"?0:undefined} aria-label="Destaques selecionados">{projects.map((w,i)=><article key={w.id} className="fm-project"><button onClick={()=>openWork(w.id)} className="fm-project-button"><MotionFrame className="fm-project-media"><SafeArt key={w.cover} src={w.cover} kind={d.art} label={w.title}/>{w.kind==="video"&&<span className="fm-play" aria-hidden>▶</span>}</MotionFrame><span className="fm-project-text"><span className="fm-project-index">{String(i+1).padStart(2,"0")} / {w.year}</span><b>{w.title}</b><span>{[w.client,w.role].filter(Boolean).join(" · ")}</span>{["editorial","split","sculpture"].includes(d.layout)&&w.description&&<span className="fm-project-description">{firstSentence(w.description)}</span>}{w.results&&<span className="fm-result">{w.results}</span>}</span></button></article>)}</div>
  </Box></section>}
  <Extras/>
  <footer id="contato"><Box className="fm-footer"><div><p className="fm-kicker">Contato</p><h2>{pr.ctaLabel||"Vamos criar o próximo projeto?"}</h2>{pr.professions?.length? <p>{pr.professions.join(" · ")}</p>:null}</div><div>{mail&&<ContactButton className="fm-cta">Conversar ↗</ContactButton>}<Socials/></div></Box></footer>
 </Page>;
}
export const MOTION_MODEL_PAGES=Object.fromEntries(MOTION_DESIGNS.map(d=>[d.id,()=> <MotionModel design={d}/>]));
