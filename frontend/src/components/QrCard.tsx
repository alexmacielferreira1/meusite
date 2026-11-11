import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { initials } from "../lib/utils";

/** Gera o QR code em SVG (sem canvas), pronto para exibir e baixar. */
export async function qrSvgDataUrl(url: string) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Cartão digital com QR code do endereço público do portfólio. */
export function QrCard({ url, name, subtitle, fileName }: { url: string; name: string; subtitle: string; fileName: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    void qrSvgDataUrl(url).then((value) => { if (alive) setSrc(value); });
    return () => { alive = false; };
  }, [url]);
  return (
    <div className="overflow-hidden rounded-3xl bg-plum-900 p-5 text-white">
      <p className="text-xs uppercase tracking-widest text-white/50">Cartão digital</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 font-bold">{initials(name)}</span>
        <div><p className="font-semibold">{name}</p><p className="text-sm text-white/60">{subtitle}</p></div>
      </div>
      <div className="mt-5 grid place-items-center rounded-2xl bg-white p-4">
        {src ? <img src={src} alt={`QR code para ${url}`} className="h-36 w-36" /> : <span className="h-36 text-sm text-slate-500">Gerando QR code…</span>}
      </div>
      {src && <a href={src} download={`${fileName}-qrcode.svg`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold hover:bg-brand-500"><Download size={16} />Baixar QR code (SVG)</a>}
    </div>
  );
}
