import { useMemo, useState } from "react";
import { Button, Field, Input, Textarea } from "../../components/ui";
import { evidenceMap, suggestEvidence } from "../../lib/evidence";
import type { Work } from "../../types/portfolio";

function EvidenceColumn({ title, brief, works, selected }: {
  title: string; brief: string; works: Work[]; selected: string[];
}) {
  const map = useMemo(() => evidenceMap(brief, works, selected), [brief, works, selected]);
  return <div className="min-w-0 rounded-2xl border border-slate-200 p-4">
    <h3 className="font-semibold text-plum-900">{title}</h3>
    {!map.length && <p className="mt-2 text-sm text-slate-600">Adicione requisitos ao briefing para conferir o acervo.</p>}
    <ul className="mt-3 space-y-3">
      {map.map(({ requirement, candidates, missing }) => {
        const included = candidates.some((candidate) => candidate.included);
        return <li key={requirement} className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="break-words font-semibold">{requirement}</p>
          <p className={included ? "text-emerald-800" : "text-amber-800"}>
            {included ? "Indício na seleção" : candidates.length ? "Indício no acervo · fora da seleção" : "Sem evidência encontrada"}
          </p>
          {candidates.slice(0, 3).map(({ work, markers, matches }) => <div key={work.id} className="mt-2 border-t border-slate-200 pt-2">
            <p className="break-words font-medium">{work.title}{work.role && ` · ${work.role}`}</p>
            {work.contribution && <p className="break-words">Contribuição cadastrada: {work.contribution}</p>}
            <p className="text-slate-600">Termos encontrados: {matches.join(", ")}</p>
            {markers.map((marker, i) => <p key={i} className="break-words text-brand-800">{marker.time} · {marker.label}</p>)}
          </div>)}
          {candidates.length > 0 && missing.length > 0 && <p className="mt-2 text-slate-600">Sem correspondência: {missing.join(", ")}.</p>}
        </li>;
      })}
    </ul>
  </div>;
}

export default function OpportunityEvidence({ title, brief, works, selected, onUse }: {
  title: string; brief: string; works: Work[]; selected: string[];
  onUse: (title: string, brief: string, ids: string[]) => void;
}) {
  const [compare, setCompare] = useState(false);
  const [secondTitle, setSecondTitle] = useState("");
  const [secondBrief, setSecondBrief] = useState("");
  const secondSelection = useMemo(() => suggestEvidence(secondBrief, works), [secondBrief, works]);
  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-plum-900">Mapa de evidências</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Comparar com outra oportunidade</label>
    </div>
    <p className="mb-4 mt-2 text-sm text-slate-600">Use uma linha por requisito. Até 20 itens são comparados por termos com o acervo compartilhável. Revise cada indício antes de tratar a experiência como comprovada.</p>
    {compare && <div className="mb-4 grid gap-3 md:grid-cols-2">
      <Field label="Título da segunda oportunidade"><Input maxLength={120} value={secondTitle} onChange={(event) => setSecondTitle(event.target.value)} /></Field>
      <Field label="Briefing da segunda oportunidade"><Textarea rows={4} maxLength={5000} value={secondBrief} onChange={(event) => setSecondBrief(event.target.value)} /></Field>
      <div><Button variant="secondary" disabled={!secondBrief.trim()} onClick={() => {
        if (window.confirm("Levar a segunda oportunidade para a edição? A apresentação atual será limpa para evitar misturar os briefings.")) {
          onUse(secondTitle.trim(), secondBrief, secondSelection);
        }
      }}>Levar segunda oportunidade para edição</Button></div>
    </div>}
    <div className={`grid gap-4 ${compare ? "lg:grid-cols-2" : ""}`}>
      <EvidenceColumn title={title || "Oportunidade em edição"} brief={brief} works={works} selected={selected} />
      {compare && <EvidenceColumn title={secondTitle || "Segunda oportunidade · seleção sugerida"} brief={secondBrief} works={works} selected={secondSelection} />}
    </div>
  </section>;
}
