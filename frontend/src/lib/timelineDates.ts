import type { TimelineItem } from "../types/portfolio";
const MONTHS=["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
export function monthLabel(value:string) { if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return ""; return `${MONTHS[Number(value.slice(5))-1]}-${value.slice(0,4)}`; }
export function readLegacyPeriod(period:string):Pick<TimelineItem,"startDate"|"endDate"|"current"> {
  const months="jan(?:eiro)?|fev(?:ereiro)?|mar(?:ço|co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?";
  const points=[...period.toLowerCase().matchAll(new RegExp(`\\b(${months})[.\\s/-]*(?:de\\s*)?((?:19|20)\\d{2})|\\b(0?[1-9]|1[0-2])[/.]((?:19|20)\\d{2})|\\b((?:19|20)\\d{2})-(0[1-9]|1[0-2])\\b`,"g"))].map(m=>m[1]?`${m[2]}-${String(MONTHS.findIndex(x=>x.toLowerCase()===m[1].slice(0,3))+1).padStart(2,"0")}`:m[3]?`${m[4]}-${m[3].padStart(2,"0")}`:`${m[5]}-${m[6]}`);
  return {startDate:points[0]??"",endDate:points[1]??"",current:/\b(atual|hoje|presente|present|current|andamento)\b/i.test(period)?"true":""};
}
export function timelinePatch(item:TimelineItem, patch:Pick<TimelineItem,"startDate"|"endDate"|"current">) {
  const value={...readLegacyPeriod(item.period),...item,...patch};
  const start=monthLabel(value.startDate??""), end=monthLabel(value.endDate??"");
  return {...patch,period:start ? `${start}${value.current==="true"?" — ATUAL":end?` — ${end}`:""}` : item.period};
}
