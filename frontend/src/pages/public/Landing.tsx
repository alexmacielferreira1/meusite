import { Check, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { TemplatePreview } from "../../components/TemplatePreview";
import { APP_DOMAIN, APP_NAME, DEMO_MODE } from "../../config/app";
import { ROLES } from "../../data/roles";
import { demoFor } from "../../data/demoContent";
import { MARKETING_MODELS } from "../../data/demoMedia";
import { TEMPLATES } from "../../data/templates";

// Preços = hipóteses do pacote do GPT (docs/gpt-pacote/01_HISTORICO_E_DECISOES.md §7), a validar.
// Três itens independentes: assinatura do portfólio, hotsite por prazo e créditos de IA.
export const PLANS = [
  { id: "gratis", name: "Grátis", price: "R$ 0", period: "para sempre", highlight: false, cta: "Começar grátis",
    items: ["1 portfólio em seu-nome." + APP_DOMAIN, "Modelos grátis", "Vídeos do YouTube e Vimeo (sem limite)", "200 MB para arquivos próprios", "10 créditos de IA por mês", "Edição manual sem limite", "Selo \"Feito com " + APP_NAME + "\""] },
  { id: "essencial", name: "Essencial", price: "R$ 5", period: "/mês · ou R$ 36/ano (R$ 3/mês)", highlight: true, cta: "Assinar o Essencial",
    items: ["Todos os modelos + Estúdio de Arte", "Sem selo", "2 GB para vídeos e arquivos próprios", "50 créditos de IA por mês", "1 hotsite de 30 dias por mês incluso", "Portfólio privado por senha", "Estatísticas de visitas e cliques", "Domínio próprio"] },
  { id: "hotsite", name: "Hotsite por oportunidade", price: "R$ 4,90", period: "por 30 dias · R$ 7,90 por 60 dias", highlight: false, cta: "Criar um hotsite",
    items: ["Página para uma vaga ou um cliente", "Até 3 evidências escolhidas a dedo", "Link com prazo, pode desativar", "Aviso antes de vencer", "Reativar ou duplicar para outra vaga", "Avulso — não precisa assinar"] },
];

export const CREDIT_PACKS = [
  { credits: 30, price: "R$ 4,90" },
  { credits: 100, price: "R$ 12,90" },
];

const COMPARE: [string, boolean, boolean][] = [
  ["Modelos feitos para cada função de comunicação", true, false],
  ["Campos de cliente, função exercida, software e veículo", true, false],
  ["Reel, vídeo em loop, clipping e demos de áudio", true, false],
  ["IA que escreve a bio e organiza os trabalhos", true, false],
  ["Diretório para ser encontrado por produtoras e agências", true, false],
  ["Hospedagem e domínio inclusos", true, true],
];

export default function Landing() {
  const demo = useMemo(() => demoFor("editor-pro"), []);
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-plum-900 text-white">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/80"><Sparkles size={14} /> {DEMO_MODE ? "Com assistente para seus textos" : "Vitrines para vagas, clientes e propostas"}</span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-6xl">Seu portfólio de comunicação no ar em <span className="text-brand-400">10 minutos</span>.</h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">Para editores, videomakers, designers, jornalistas, social media e quem vive de comunicação. Escolha sua função, suba seus trabalhos e publique. Sem código, sem plugin, sem dor de cabeça.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cadastro" className="rounded-xl bg-brand-600 px-6 py-3.5 font-semibold hover:bg-brand-700">Criar meu portfólio grátis</Link>
              <a href={"/exemplo/editor-pro"} target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 px-6 py-3.5 font-semibold hover:bg-white/10">Ver um exemplo</a>
            </div>
            <p className="mt-4 text-sm text-white/50">Grátis para começar · sem cartão</p>
          </div>
          <div className="relative mx-auto w-full min-w-0 max-w-[520px]">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex h-7 items-center gap-1.5 bg-ink-800 px-3"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="ml-3 text-[11px] text-white/50">{DEMO_MODE ? `${APP_DOMAIN}/exemplo/editor-pro` : "/exemplo"}</span></div>
              <TemplatePreview portfolio={demo} width="fill" height={340} />
            </div>
          </div>
        </div>
      </section>

      {/* FUNÇÕES */}
      <section id="funcoes" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Feito para a sua função</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Cada função ganha um modelo e campos próprios. Um editor mostra reel e software; um jornalista mostra matéria e veículo.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-5 transition hover:border-brand-400 hover:shadow-sm">
              <span className="text-2xl">{r.emoji}</span>
              <h3 className="mt-3 font-semibold">{r.label}</h3>
              <p className="mt-1 text-sm text-slate-500">{r.needs}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Três passos, nenhum código</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Wand2, t: "Responda 4 perguntas", d: "Escolha função, objetivo e estilo. O Folios monta um rascunho que você pode personalizar." },
              { icon: Upload, t: "Suba seus trabalhos", d: "Adicione imagens e links de vídeos, áudios ou matérias. Registre sua função e o que você entregou." },
              { icon: Sparkles, t: "Publique e compartilhe", d: "Coloque seu site no ar e compartilhe seleções com prazo para clientes e recrutadores." },
            ].map(({ icon: I, t, d }, i) => (
              <div key={t} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><I size={20} /></span><span className="text-sm font-semibold text-slate-400">0{i + 1}</span></div>
                <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODELOS */}
      <section id="modelos" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Modelos que já nascem com cara de profissional</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Troque de modelo quando quiser: seu conteúdo continua no lugar.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {MARKETING_MODELS.map((id) => TEMPLATES.find((t) => t.id === id)!).map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-slate-200">
              <a className="block w-full" href={`/exemplo/${t.id}`} aria-label={`Ver exemplo ${t.name}`}><TemplatePreview portfolio={demoFor(t.id)} templateId={t.id} width="fill" height={300} /></a>
              <div className="flex items-start justify-between gap-4 border-t border-slate-100 p-5">
                <div><h3 className="font-semibold">{t.name}</h3><p className="mt-1 text-sm text-slate-500">{t.description}</p></div>
                {t.plan === "essencial" && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Essencial</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARAÇÃO */}
      {DEMO_MODE && <section className="bg-plum-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Por que não um construtor genérico?</h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1fr_110px_110px] bg-white/5 px-5 py-3 text-sm text-white/60"><span /> <span className="text-center font-semibold text-white">{APP_NAME}</span><span className="text-center">Genéricos</span></div>
            {COMPARE.map(([label, a, b]) => (
              <div key={label} className="grid grid-cols-[1fr_110px_110px] border-t border-white/10 px-5 py-3.5 text-sm">
                <span>{label}</span>
                <span className="flex justify-center">{a ? <Check className="text-emerald-400" size={18} /> : <X className="text-white/30" size={18} />}</span>
                <span className="flex justify-center">{b ? <Check className="text-emerald-400" size={18} /> : <X className="text-white/30" size={18} />}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      }
      {/* PLANOS */}
      {DEMO_MODE ? <section id="planos" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Preço de quem é freelancer</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Pague pelo portfólio, por um hotsite quando surgir uma oportunidade, ou por créditos de IA — cada um separado, sem surpresa.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-2xl border p-6 ${p.highlight ? "border-brand-500 shadow-lg ring-1 ring-brand-500" : "border-slate-200"}`}>
              {p.highlight && <span className="mb-3 w-fit rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">Mais escolhido</span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-3"><span className="font-display text-4xl font-bold">{p.price}</span> <span className="text-sm text-slate-500">{p.period}</span></p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.items.map((i) => <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand-600" />{i}</li>)}
              </ul>
              <Link to="/cadastro" className={`mt-8 rounded-xl py-3 text-center text-sm font-semibold ${p.highlight ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-slate-300 hover:bg-slate-50"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">Créditos extras de IA: {CREDIT_PACKS.map((c) => `${c.credits} por ${c.price}`).join(" · ")}. Mídia extra: +10 GB por R$ 4,90/mês. O custo aparece antes de gerar; falhou, não cobra. Edição manual nunca gasta crédito.</p>
      </section>

      : <section id="planos" className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">Acesso gratuito no piloto</h2>
        <p className="mt-3 text-slate-600">O Folios está em fase piloto, com acesso gratuito. Publique seu portfólio e organize seus trabalhos. Planos pagos e contratação ainda não estão disponíveis.</p>
        <Link to="/cadastro" className="mt-5 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white">Criar conta</Link>
      </section>}

      <section className="mx-auto mb-20 max-w-6xl px-4">
        <div className="rounded-3xl bg-brand-600 px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Seu próximo cliente vai pedir o link.</h2>
          <p className="mt-3 text-white/80">Tenha um para mandar hoje.</p>
          <Link to="/cadastro" className="mt-8 inline-block rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-700 hover:bg-brand-50">Criar meu portfólio grátis</Link>
        </div>
      </section>
    </main>
  );
}
