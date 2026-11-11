import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Portfolio } from "../types/portfolio";
import { api, ApiError, type User } from "./api";
import { demoPortfolio } from "../data/seed";
import { businessDemo } from "../business/adapter";
import { DEMO_MODE } from "../config/app";
import { slugify } from "./utils";

interface Store {
  user: User | null;
  portfolio: Portfolio;
  setUser: (u: User | null) => Promise<void>;
  update: (fn: (p: Portfolio) => Portfolio) => void;
  replace: (p: Portfolio) => void;
  resetDemo: () => void;
  storageFull: boolean;
  ready: boolean;
  error: string;
  publishedSlug: string | null;
  flush: () => Promise<void>;
  setPublication: (on: boolean) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

function blank(user?: User, credits = 10): Portfolio {
  const p = demoPortfolio();
  return {
    ...p,
    profile: {
      name: user?.name ?? "", email: "", headline: "", roleId: "editor", city: "", state: "",
      bio: "", whatsapp: "", instagram: "", linkedin: "", website: "", available: false, inDirectory: false, stats: [], pillars: [],
    },
    works: [], clients: [], services: [], experience: [], education: [], testimonials: [],
    site: { ...p.site, templateId:"biz-pizzaria", theme:{...p.site.theme,accent:"#176d58",radius:"lg"}, slug: slugify(user?.name ?? "").slice(0, 50).replace(/-$/, "") || "meu-negocio", published: false },
    plan: "gratis", aiCredits: credits, analytics: { visits: Array(14).fill(0), contactClicks: 0, topWork: "" },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, putUser] = useState<User | null>(() => DEMO_MODE ? api.currentUser() : null);
  const [portfolio, putPortfolio] = useState<Portfolio>(() => DEMO_MODE ? api.loadPortfolio() ?? businessDemo() : blank());
  const [ready, setReady] = useState(DEMO_MODE);
  const [error, setError] = useState("");
  const [storageFull, setStorageFull] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const latest = useRef(portfolio);
  const revision = useRef(0);
  const dirty = useRef(false);
  const pending = useRef<Promise<void> | null>(null);
  const timer = useRef<number>();

  function show(p: Portfolio) {
    latest.current = p;
    putPortfolio(p);
  }

  async function setUser(account: User | null) {
    if (!DEMO_MODE) {
      window.clearTimeout(timer.current);
      const state = account ? await api.draft() : null;
      revision.current = state?.revision ?? 0;
      dirty.current = false;
      setPublishedSlug(state?.publishedSlug ?? null);
      setError("");
      show(state?.portfolio ?? blank(account ?? undefined, state?.credits));
    }
    putUser(account);
  }

  useEffect(() => {
    if (DEMO_MODE) return;
    api.session().then(setUser).catch((err: unknown) => {
      if (!(err instanceof ApiError && err.status === 401)) setError("Não foi possível carregar sua conta. Recarregue a página para tentar novamente.");
    }).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (DEMO_MODE) return;
    const warnIfUnsaved = (event: BeforeUnloadEvent) => {
      if (dirty.current || pending.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warnIfUnsaved);
    return () => window.removeEventListener("beforeunload", warnIfUnsaved);
  }, []);

  async function flush() {
    if (DEMO_MODE) return;
    if (pending.current) await pending.current;
    if (!dirty.current && revision.current > 0) return;
    const snapshot = latest.current;
    dirty.current = false;
    const operation = api.persist(snapshot, revision.current).then((result) => {
      revision.current = result.revision;
      setError("");
    }).catch((err: Error) => {
      dirty.current = true;
      setError(err.message);
      throw err;
    });
    pending.current = operation;
    try { await operation; } finally { pending.current = null; }
    if (dirty.current) await flush();
  }

  function replace(p: Portfolio) {
    show(p);
    if (DEMO_MODE) {
      setStorageFull(!api.savePortfolio(p));
      return;
    }
    dirty.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush().catch(() => {}), 650);
  }

  function update(fn: (p: Portfolio) => Portfolio) { replace(fn(structuredClone(latest.current))); }

  async function setPublication(on: boolean) {
    if (DEMO_MODE) {
      update((p) => ({ ...p, site: { ...p.site, published: on } }));
      return;
    }
    try {
      if (on) {
        await flush();
        const result = await api.publish(revision.current);
        revision.current = result.revision;
        setPublishedSlug(result.publishedSlug);
      } else {
        await api.unpublish();
        setPublishedSlug(null);
      }
      const current = latest.current;
      show({ ...current, site: { ...current.site, published: on } });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na publicação.");
      throw err;
    }
  }

  return <Ctx.Provider value={{
    user, portfolio, setUser, update, replace, resetDemo: () => { if (DEMO_MODE) replace(demoPortfolio()); },
    storageFull, ready, error, publishedSlug, flush, setPublication,
  }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fora do StoreProvider");
  return s;
}
