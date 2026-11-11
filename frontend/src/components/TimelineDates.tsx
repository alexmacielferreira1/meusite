import {useState} from "react";
import type { TimelineItem } from "../types/portfolio";
import { readLegacyPeriod, timelinePatch } from "../lib/timelineDates";
export function TimelineDates({item,onChange}:{item:TimelineItem;onChange:(patch:Record<string,string>)=>void}) {
 const [error,setError]=useState("");
 const d={...readLegacyPeriod(item.period),...item};
 const set=(patch:Pick<TimelineItem,"startDate"|"endDate"|"current">)=>{
  const next={...d,...patch};
  if(next.startDate&&next.endDate&&next.current!=="true"&&next.endDate<next.startDate){setError("O término precisa ser posterior ou igual ao início.");return;}
  setError("");onChange(timelinePatch(item,patch) as Record<string,string>);
 };
 return <div className="space-y-2 sm:col-span-full">
  <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs text-slate-600">Início<input aria-label={`Início de ${item.title||"item"}`} type="month" min="1900-01" max={d.endDate||"2100-12"} value={d.startDate??""} onChange={e=>set({startDate:e.target.value})} className="mt-1 block h-10 w-full min-w-0 rounded-lg border bg-white px-2 text-sm"/></label>
  <label className="text-xs text-slate-600">Término<input aria-label={`Término de ${item.title||"item"}`} type="month" min={d.startDate||"1900-01"} max="2100-12" disabled={d.current==="true"} value={d.endDate??""} onChange={e=>set({endDate:e.target.value})} className="mt-1 block h-10 w-full min-w-0 rounded-lg border bg-white px-2 text-sm disabled:opacity-40"/></label>
  <label className="flex items-center gap-2 self-end pb-3 text-xs"><input type="checkbox" checked={d.current==="true"} onChange={e=>set({current:e.target.checked?"true":"",endDate:e.target.checked?"":d.endDate??""})}/>Em andamento</label></div>
  {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
  {item.period&&<p className="text-xs text-slate-500">{item.period}{!d.startDate&&" · Data antiga preservada. Selecione mês e ano para padronizar."}</p>}
 </div>;
}
