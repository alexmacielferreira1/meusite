import { portfolioPath } from "../../config/publicPaths";
import { BadgeCheck, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ROLES, roleById } from "../../data/roles";
import { DIRECTORY } from "../../data/seed";
import { DEMO_MODE } from "../../config/app";
import { request } from "../../lib/api";
import type { DirectoryEntry } from "../../types/portfolio";
import { coverStyle, initials } from "../../lib/utils";

export default function Directory() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [uf, setUf] = useState("");
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [entries, setEntries] = useState<DirectoryEntry[]>(DEMO_MODE ? DIRECTORY : []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!DEMO_MODE) request<DirectoryEntry[]>("/public/directory").then(setEntries).catch(() => setError("Não foi possível carregar o diretório."));
  }, []);
  const ufs = useMemo(() => Array.from(new Set(entries.map((d) => d.state).filter(Boolean))).sort(), [entries]);
  const list = entries.filter((d) =>
    (!q || `${d.name} ${d.headline} ${d.city} ${d.software.join(" ")}`.toLowerCase().includes(q.toLowerCase())) &&
    (!role || d.roleId === role) && (!uf || d.state === uf) && (!onlyAvail || d.available));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Diretório de profissionais de comunicação</h1>
      <p className="mt-2 text-slate-600">Encontre editores, designers, jornalistas e outros profissionais com portfólio completo. {DEMO_MODE && "Perfis de demonstração."}</p>
      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}

      <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_200px_120px_auto]">
        <label className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, cidade, software…" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-brand-400" />
        </label>
        <select aria-label="Função" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">Todas as funções</option>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select aria-label="Estado" value={uf} onChange={(e) => setUf(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">UF</option>{ufs.map((u) => <option key={u}>{u}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} /> Disponíveis</label>
      </div>

      <p className="mt-6 text-sm text-slate-500">{list.length} profissionais</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <a key={d.slug} href={DEMO_MODE && d.slug !== "marinaduarte" ? "#" : portfolioPath(d.slug)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
            <div className="h-28" style={coverStyle(d.cover)} />
            <div className="p-5 pt-0">
              <span className="-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-ink-900 font-semibold text-white">{initials(d.name)}</span>
              <div className="mt-3 flex items-center gap-1.5"><h3 className="font-semibold group-hover:underline">{d.name}</h3>{d.complete && <BadgeCheck size={16} className="text-brand-600" aria-label="Perfil completo" />}</div>
              <p className="text-sm text-slate-600">{d.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{roleById(d.roleId).short}</span>
                <span className="inline-flex items-center gap-1 text-slate-500"><MapPin size={12} />{d.city}/{d.state}</span>
                <span className={`rounded-full px-2 py-0.5 ${d.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{d.available ? "Disponível" : "Agenda cheia"}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">{d.software.join(" · ")}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
