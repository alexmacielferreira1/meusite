import {Link} from "react-router-dom";
export function Logo({dark,to="/"}:{dark?:boolean;to?:string}){return <Link to={to} aria-label="MeuSite" className={`inline-flex items-center gap-2 text-3xl font-bold tracking-tight ${dark?'text-white':'text-slate-900'}`}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white">m</span>MeuSite</Link>;}
