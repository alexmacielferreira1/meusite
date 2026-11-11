import { Brush, Clapperboard, ImagePlus, RotateCcw, ScanFace, Subtitles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SiteDesignCanvas } from "../../components/SiteDesignCanvas";
import { ArtStudio } from "../../components/ArtStudio";
import { PageHeader } from "../../components/layout/AppShell";
import { useStore } from "../../lib/store";
import { coverStyle } from "../../lib/utils";

// Recursos do MediaMind AI que entram por paridade (docs/ESTUDIO_DE_ARTE.md). Aqui só como vitrine do que vem.
const COMING = [
  { icon: Clapperboard, t: "Thumbnail a partir do vídeo", d: "Escolher o quadro e montar a capa" },
  { icon: ScanFace, t: "Recortar pessoa / remover fundo", d: "Retrato limpo para o hero" },
  { icon: Subtitles, t: "Legendas automáticas", d: "Whisper, como no MediaMind" },

];

export default function Studio() {
  const { portfolio: p, update } = useStore();
  const [params, setParams] = useSearchParams();
  const [view,setView]=useState<"arts"|"site">("arts");
  const [editing, setEditing] = useState<string | null>(null); // id do trabalho ou "foto"

  useEffect(() => { const w = params.get("trabalho") || (params.get("foto") ? "foto" : ""); if (w) { setEditing(w); setParams({}, { replace: true }); } }, [params, setParams]);

  const work = p.works.find((w) => w.id === editing);
  const source = editing === "foto" ? p.profile.photo ?? "grad:260" : work?.cover ?? "grad:200";

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader icon={<Brush className="text-brand-600" size={32} />} title="Estúdio de Arte" subtitle="Ajuste imagens do negócio e do catálogo sem sair do Folios. O original fica guardado e cada ajuste vira uma versão." />

      <div className="mb-6 flex flex-wrap gap-2"><button onClick={()=>setView("arts")} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view==="arts"?"border-brand-500 bg-brand-50 text-brand-700":"bg-white"}`}>Artes e imagens</button><button onClick={()=>setView("site")} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view==="site"?"border-brand-500 bg-brand-50 text-brand-700":"bg-white"}`}>Composição do meu site</button></div>
      {view==="site"?<SiteDesignCanvas/>:<>
      <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 p-4"><h2 className="font-semibold text-brand-900">Canvas com camadas para suas artes</h2><p className="mt-1 text-sm text-slate-600">Abra Editar arte para mover imagens, textos e formas, ajustar cor e luz, ordenar camadas, desfazer e exportar. O projeto fica editável e o original é preservado.</p></div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Suas artes</h2>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-square bg-cover bg-center" style={p.profile.photo ? { backgroundImage: `url(${p.profile.photo})` } : coverStyle("grad:260")} />
          <div className="flex items-center justify-between p-4"><span className="font-semibold">Imagem principal do negócio</span>
            <button onClick={() => setEditing("foto")} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white">Editar arte</button></div>
        </article>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-4">{p.profile.photoOriginal&&<button className="rounded-lg border bg-white px-3 py-2 text-xs" onClick={()=>update(x=>{x.profile.photo=x.profile.photoOriginal;return x;})}>Restaurar retrato original</button>}{p.profile.photoVersions?.map((photo,i)=><button key={i} title={`Usar retrato versão ${i+1}`} aria-label={`Usar retrato versão ${i+1}`} className="h-12 w-12 rounded-lg border bg-cover bg-center" style={{backgroundImage:`url(${photo})`}} onClick={()=>update(x=>{x.profile.photo=photo;return x;})}/>)}</div>
        {p.works.map((w) => (
          <article key={w.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="aspect-video" style={coverStyle(w.cover)} />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{w.title}</span>
                <button onClick={() => setEditing(w.id)} className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white">Editar arte</button></div>
              {(w.coverVersions?.length || w.coverOriginal) ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {w.coverOriginal && <button title="Voltar ao original" onClick={() => update((x) => { const y = x.works.find((k) => k.id === w.id)!; y.cover = y.coverOriginal!; return x; })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs"><RotateCcw size={12} /> Original</button>}
                  {w.coverVersions?.map((v, i) => (
                    <button key={i} title={`Usar versão ${i + 1}`} onClick={() => update((x) => { x.works.find((k) => k.id === w.id)!.cover = v; return x; })}
                      className={`h-9 w-14 rounded-lg border-2 bg-cover bg-center ${w.cover === v ? "border-brand-600" : "border-transparent"}`} style={{ backgroundImage: `url(${v})` }} />
                  ))}
                </div>
              ) : <p className="mt-2 text-xs text-slate-400">Sem versões ainda.</p>}
            </div>
          </article>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-slate-500">Chegando do MediaMind AI</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COMING.map(({ icon: I, t, d }) => (
          <div key={t} className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 opacity-80">
            <I className="text-brand-600" /><p className="mt-3 font-semibold">{t}</p><p className="text-sm text-slate-500">{d}</p>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">em breve</span>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-brand-50 p-5"><Wand2 className="text-brand-700" /><p className="mt-3 font-semibold text-plum-900">Já funciona</p><p className="text-sm text-slate-600">Ajustes rápidos e canvas com camadas: texto, imagens, formas, arraste, alinhamento, rotação, opacidade, histórico e exportação.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><ImagePlus className="text-brand-700" /><p className="mt-3 font-semibold">Versões para cada lugar</p><p className="text-sm text-slate-500">Horizontal para o site, vertical para Reels, 1.91:1 para a prévia do link.</p></div>
      </div>

      </>}
      {editing && (
        <ArtStudio initialDocument={editing==="foto"?p.profile.artDocument:work?.artDocument} source={source} accent={p.site.theme.accent} title={editing === "foto" ? "" : work?.title} credits={p.aiCredits}
          onSpendCredit={() => update((x) => { x.aiCredits = Math.max(0, x.aiCredits - 1); return x; })}
          onClose={() => setEditing(null)}
          onSave={({ dataUrl, document }, apply) => {
            update((x) => {
              if (editing === "foto") {
                if(!x.profile.photoOriginal)x.profile.photoOriginal=x.profile.photo;
                x.profile.photoVersions=[dataUrl,...(x.profile.photoVersions??[])].slice(0,3);
                x.profile.artDocument=document;
                if(apply){x.profile.photo=dataUrl;if(x.business)x.business.heroImage=dataUrl;}
                return x;
              }
              const w = x.works.find((k) => k.id === editing); if (!w) return x;
              w.artDocument=document;
              if (!w.coverOriginal) w.coverOriginal = w.cover;
              w.coverVersions = [dataUrl, ...(w.coverVersions ?? [])].slice(0, 3); // demo: 3 versões (limite do navegador)
              if (apply){w.cover=dataUrl;const item=x.business?.items.find(i=>i.id===w.id);if(item)item.image=dataUrl;}
              return x;
            });
            setEditing(null);
          }} />
      )}
    </div>
  );
}

