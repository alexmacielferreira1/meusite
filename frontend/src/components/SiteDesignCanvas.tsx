import {useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {useStore} from "../lib/store";
import {templateById} from "../data/templates";
import {PresentationControls} from "./PresentationControls";
export function SiteDesignCanvas(){
 const {portfolio:p,update}=useStore();const frame=useRef<HTMLIFrameElement>(null);const [mobile,setMobile]=useState(false);
 const push=()=>frame.current?.contentWindow?.postMessage({type:"meusite:preview",portfolio:p},location.origin);
 useEffect(push,[p]);useEffect(()=>{const ready=(e:MessageEvent)=>{if(e.source===frame.current?.contentWindow&&e.origin===location.origin&&e.data?.type==="meusite:preview-ready")push();};window.addEventListener("message",ready);return()=>window.removeEventListener("message",ready);});
 const set=(patch:Partial<typeof p.site.theme>)=>update(x=>{x.site.theme={...x.site.theme,...patch};return x;});
 return <section className="grid gap-5 xl:grid-cols-[320px_1fr]"><aside className="space-y-4 rounded-3xl border bg-white p-5"><h2 className="font-display text-xl font-bold">Composição do site</h2><p className="text-xs text-slate-500">Ajuste o modelo com seus dados. As mudanças ficam no rascunho; use Republicar para atualizar o site público.</p>
  <label className="flex items-center justify-between text-sm">Destaque<input aria-label="Cor de destaque do canvas" type="color" value={p.site.theme.accent} onChange={e=>set({accent:e.target.value})}/></label>
  <label className="flex items-center justify-between text-sm">Fundo geral<input aria-label="Fundo geral do site" type="color" value={p.site.theme.background??(p.site.theme.mode==="dark"?"#111827":"#ffffff")} onChange={e=>set({background:e.target.value})}/></label>
  <label className="flex items-center justify-between text-sm">Texto base<input aria-label="Texto base do site" type="color" value={p.site.theme.ink??(p.site.theme.mode==="dark"?"#ffffff":"#111827")} onChange={e=>set({ink:e.target.value})}/></label>
  <p className="text-[11px] text-slate-500">Blocos com cor própria preservam o acabamento do modelo. Confira o contraste na prévia.</p>
  <button className="text-xs font-semibold text-brand-700 underline" onClick={()=>update(x=>{delete x.site.theme.background;delete x.site.theme.ink;x.site.theme.accent=templateById(x.site.templateId).theme.accent;return x;})}>Restaurar cores do modelo</button>
  <label className="block text-sm">Tipografia<select aria-label="Tipografia do canvas" value={p.site.theme.font} onChange={e=>set({font:e.target.value as typeof p.site.theme.font})} className="mt-1 w-full rounded-lg border p-2"><option value="sans">Moderna</option><option value="display">Marcante</option><option value="serif">Editorial</option></select></label>
  <label className="block text-sm">Cantos<select aria-label="Cantos do canvas" value={p.site.theme.radius} onChange={e=>set({radius:e.target.value as typeof p.site.theme.radius})} className="mt-1 w-full rounded-lg border p-2"><option value="none">Retos</option><option value="md">Suaves</option><option value="lg">Redondos</option></select></label>
  <PresentationControls value={p.site.presentation} onChange={presentation=>update(x=>{x.site.presentation=presentation;return x;})}/><Link to="/app/secoes" className="block text-sm font-semibold text-brand-700 underline">Escolher modelo e organizar blocos →</Link>
 </aside><div className="min-w-0 rounded-3xl border bg-white p-4"><div className="mb-3 flex gap-2"><button className={`rounded-lg border px-3 py-2 text-xs ${!mobile?"bg-brand-50 text-brand-700":""}`} onClick={()=>setMobile(false)}>Desktop</button><button className={`rounded-lg border px-3 py-2 text-xs ${mobile?"bg-brand-50 text-brand-700":""}`} onClick={()=>setMobile(true)}>Celular</button></div><div className={`mx-auto overflow-hidden rounded-2xl border ${mobile?"max-w-[390px]":"w-full"}`}><iframe title="Canvas do meu site" ref={frame} src="/preview" className="h-[75vh] w-full"/></div></div></section>;
}
