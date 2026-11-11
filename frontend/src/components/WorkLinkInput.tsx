import {useState} from "react";
import type { WorkKind } from "../types/portfolio";
import {Field,Input} from "./ui";
import {PROVIDERS,identifyProvider,mediaCode,buildMediaUrl,mediaError,type ProviderId} from "../lib/mediaProviders";
export function WorkLinkInput({value,onChange,kind="video"}:{value:string;onChange:(value:string)=>void;kind?:WorkKind}) {
 const [id,setId]=useState<ProviderId>(()=>value?identifyProvider(value):kind==="video"?"youtube":"other");
 const p=PROVIDERS.find(p=>p.id===id)!;const [draft,setDraft]=useState(()=>value?mediaCode(id,value):"");
 const error=draft?mediaError(id,buildMediaUrl(id,draft)):"";
 return <div className="space-y-3"><Field label="Origem do trabalho"><select aria-label="Origem do trabalho" value={id} className="h-10 w-full rounded-lg border bg-white px-3 text-sm" onChange={e=>{const next=e.target.value as ProviderId;setId(next);setDraft("");onChange("");}}>{PROVIDERS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
 <Field label="Link do trabalho *" hint={p.hint}><div className="overflow-hidden rounded-lg border border-slate-200">{p.prefix&&<div className="overflow-x-auto border-b bg-slate-50 px-3 py-2 text-xs text-slate-500" aria-label="Prefixo fixo, não editável">{p.prefix}</div>}<Input aria-label="Link do trabalho *" value={draft} placeholder={p.prefix?"Cole somente o código":"https://…"} aria-invalid={!!error} className="border-0" onChange={e=>{const input=e.target.value;const actual=identifyProvider(input);const next=input.startsWith("http")&&actual!=="other"?actual:id;const code=mediaCode(next,input);setId(next);setDraft(code);onChange(code?buildMediaUrl(next,code):"");}}/></div></Field>
 {error&&<p aria-live="polite" className="text-xs text-amber-800">{error}</p>}
 <p className="text-xs text-slate-500">A incorporação depende das permissões da origem. O visitante também poderá abrir o trabalho na plataforma. Não cole código HTML.</p>
 </div>;
}
