import { DEMO_MODE } from "../../config/app";
import { api } from "../../lib/api";
import { Check, Clapperboard, Info, Layers, Loader2, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/layout/AppShell";
import { describeWork, generateBio, type Tone } from "../../lib/ai";
import { useStore } from "../../lib/store";
import { cn, coverStyle } from "../../lib/utils";

type Mode = "bio" | "work" | "curadoria";
const TONES: [Tone, string][] = [["profissional", "Direto"], ["criativo", "Editorial"], ["proximo", "Informal"]];

export default function Assistant() {
  const { portfolio: p, update } = useStore();
  const [mode, setMode] = useState<Mode>("bio");
  const [tone, setTone] = useState<Tone>("profissional");
  const [workId, setWorkId] = useState(p.works[0]?.id ?? "");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const work = p.works.find((w) => w.id === workId);
  const current = mode === "bio" ? p.profile.bio : work?.description ?? "";

  // curadoria: destaque primeiro, depois os mais recentes
  const curated = [...p.works].sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || Number(b.year) - Number(a.year));

  async function generate() {
    setBusy(true); setApplied(false); setError(""); setSuggestion("");
    const years = p.profile.stats[0]?.value.replace(/\D/g, "") ?? "";
    try {
      if (DEMO_MODE) {
        const text = mode === "bio" ? await generateBio(p.profile, years, p.profile.headline.split("para ")[1] ?? "", tone) : work ? await describeWork(work) : "";
        setSuggestion(text);
      } else {
        const { name, headline, roleId, city, bio, stats } = p.profile;
        const { title, role, client, category, software, description, contribution, deliverables } = work ?? {};
        const facts = mode === "bio" ? { name, headline, roleId, city, bio, stats, tone } : { title, role, client, category, software, description, contribution, deliverables };
        const result = await api.suggest(mode === "bio" ? "bio" : "work", facts);
        setSuggestion(result.text);
        update((x) => ({ ...x, aiCredits: result.credits }));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao gerar sugestão."); }
    finally { setBusy(false); }
  }

  function apply() {
    update((x) => {
      if (mode === "bio") x.profile.bio = suggestion;
      if (mode === "work") { const w = x.works.find((y) => y.id === workId); if (w) w.description = suggestion; }
      if (mode === "curadoria") x.works = curated.map((c) => x.works.find((y) => y.id === c.id)!);
      if (DEMO_MODE) x.aiCredits = Math.max(0, x.aiCredits - 1);
      return x;
    });
    setApplied(true); setSuggestion("");
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <PageHeader icon={<Sparkles className="text-brand-600" size={34} />} title="Assistente IA" subtitle="Melhore seus textos e revise cada mudança antes de aplicar." />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {([["bio", User, "Bio profissional"], ["work", Clapperboard, "Descrição de trabalho"], ["curadoria", Layers, "Curadoria"]] as const).map(([m, I, l]) => (
          <button key={m} disabled={busy} onClick={() => { setMode(m); setSuggestion(""); setApplied(false); }} className={cn("flex items-center gap-2.5 rounded-xl px-5 py-3 text-[15px]", mode === m ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50")}><I size={19} />{l}</button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      {mode !== "curadoria" ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {mode === "work" && (
              <select aria-label="Trabalho" disabled={busy} value={workId} onChange={(e) => { setWorkId(e.target.value); setSuggestion(""); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                {p.works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
            )}
            {mode === "bio" && (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-plum-900">Tom do texto <Info size={16} className="text-slate-400" /></span>
                <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                  {TONES.map(([t, l]) => <button key={t} onClick={() => setTone(t)} className={cn("rounded-lg px-6 py-2 text-sm", tone === t ? "bg-brand-100 font-semibold text-brand-700" : "text-slate-600")}>{l}</button>)}
                </div>
              </>
            )}
            <button onClick={generate} disabled={busy || (mode === "work" && !work) || (!DEMO_MODE && !p.aiCredits)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700">{busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Gerar sugestão {!DEMO_MODE && "· 1 crédito"}</button>
            <span className="text-sm text-slate-500">{p.aiCredits} créditos restantes</span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-bold text-plum-900">Texto atual</h2>
              <p className="whitespace-pre-line px-6 py-5 leading-relaxed text-slate-700">{current || <span className="text-slate-400">Ainda vazio.</span>}</p>
            </section>
            <section className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
              <h2 className="border-b border-brand-100 bg-brand-50 px-6 py-4 text-lg font-bold text-plum-900">Sugestão editável</h2>
              {suggestion ? <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={8} className="w-full resize-none px-6 py-5 leading-relaxed text-slate-800 outline-none" />
                : <p className="px-6 py-5 text-slate-400">{applied ? "Aplicado ✓ Gere outra sugestão se quiser." : "Clique em Gerar sugestão para ver uma nova versão aqui."}</p>}
            </section>
          </div>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-plum-900">Ordem sugerida para os seus trabalhos</h2>
          <p className="mt-1 text-sm text-slate-500">Destaque primeiro, depois os mais recentes. É a ordem em que aparecem no site.</p>
          <ol className="mt-5 space-y-2">
            {curated.map((w, i) => (
              <li key={w.id} className="flex items-center gap-4 rounded-xl border border-slate-100 p-2.5">
                <span className="w-6 text-center font-semibold text-brand-700">{i + 1}</span>
                <span className="h-12 w-20 shrink-0 rounded-lg" style={coverStyle(w.cover)} />
                <span className="flex-1"><b className="block text-slate-900">{w.title}</b><span className="text-sm text-slate-500">{w.client} · {w.year}</span></span>
                {w.featured && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">destaque</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4">
        <p className="flex items-center gap-2 text-slate-600"><Info size={18} /> Revise as informações antes de aplicar.</p>
        <div className="flex gap-3">
          <button onClick={() => setSuggestion("")} className="h-11 rounded-xl border border-slate-300 px-6 font-medium hover:bg-slate-50">Descartar</button>
          <button onClick={apply} disabled={mode !== "curadoria" && !suggestion} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            <Check size={18} /> {mode === "bio" ? "Aplicar à bio" : mode === "work" ? "Aplicar ao trabalho" : "Aplicar ordem"}
          </button>
        </div>
      </div>
    </div>
  );
}
