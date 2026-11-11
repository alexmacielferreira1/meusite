import { Bot, Bug, CreditCard, Gauge, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import { PageHeader } from "../../../components/layout/AppShell";
import { DEMO_MODE } from "../../../config/app";
import { useStore } from "../../../lib/store";
import { cn } from "../../../lib/utils";
import AdminAi from "../AdminAi";
import Admins from "./Admins";
import Errors from "./Errors";
import Overview from "./Overview";
import Payments from "./Payments";
import Users from "./Users";

const TABS = [
  { id: "visao-geral", label: "Visão geral", icon: Gauge, page: Overview },
  { id: "usuarios", label: "Usuários", icon: UsersIcon, page: Users },
  { id: "pagamentos", label: "Planos e pagamentos", icon: CreditCard, page: Payments },
  { id: "erros", label: "Erros", icon: Bug, page: Errors },
  { id: "ia", label: "IA", icon: Bot, page: () => <AdminAi embedded /> },
  { id: "administradores", label: "Administradores", icon: ShieldCheck, page: Admins },
];

/**
 * Administração do sistema no próprio app: só para administradores (ADMIN_EMAILS e os adicionados na aba Administradores).
 * Cada aba tem endereço próprio (/app/admin/usuarios…), para voltar direto a ela.
 */
export default function Admin() {
  const { user } = useStore();
  const { aba = "visao-geral" } = useParams();
  if (DEMO_MODE) return <div className="p-8"><PageHeader title="Administração" subtitle="Disponível só com o servidor conectado." /></div>;
  if (!user?.admin) return <div className="p-8"><PageHeader title="Área restrita" subtitle="Esta página é só para a administração do site." /></div>;
  const tab = TABS.find((t) => t.id === aba);
  if (!tab) return <Navigate to="/app/admin" replace />;
  const Page = tab.page;
  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8">
      <PageHeader title="Administração" subtitle="Usuários, planos, pagamentos, erros, IA e quem administra o MeuSite." />
      <nav aria-label="Abas da administração" className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 px-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <NavLink key={id} to={id === "visao-geral" ? "/app/admin" : `/app/admin/${id}`} end
            className={() => cn("flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition",
              id === tab.id ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-slate-600 hover:text-plum-900")}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <Page />
    </div>
  );
}
