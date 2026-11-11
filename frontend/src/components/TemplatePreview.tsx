import { useEffect, useMemo, useRef, useState } from "react";
import { templateById } from "../data/templates";
import { sectionsFrom } from "../data/seed";
import { PortfolioSite } from "../site/PortfolioSite";
import type { Portfolio } from "../types/portfolio";

/** Miniatura viva de um site: renderiza o site real em 1280px e reduz com CSS.
 *  `height="auto"` mede a página inteira (usado na visualização grande). */
export function TemplatePreview({ portfolio, templateId, width = 320, height = 220, keepTheme }: {
  portfolio: Portfolio; templateId?: string; width?: number | "fill"; height?: number | "auto"; keepTheme?: boolean;
}) {
  const p = useMemo(() => {
    if (!templateId) return portfolio;
    const tpl = templateById(templateId);
    return { ...portfolio, site: { ...portfolio.site, templateId, theme: keepTheme ? portfolio.site.theme : { ...tpl.theme }, sections: sectionsFrom(tpl.sections) } };
  }, [portfolio, templateId, keepTheme]);
  const [hovered,setHovered]=useState(false);
  const live=height==="auto"||hovered;
  // Only the hovered thumbnail runs motion. Enlarged previews keep the real settings.
  const still = useMemo(() => ({...p,site:{...p.site,presentation:{...p.site.presentation,motion:"off" as const,pointer:false,ambient:false}}}),[p]);
  const outer = useRef<HTMLDivElement>(null);
  const [fillW, setFillW] = useState(400);
  useEffect(() => {
    if (width !== "fill" || !outer.current?.parentElement) return;
    const parent = outer.current.parentElement;
    const ro = new ResizeObserver(() => setFillW(parent.clientWidth));
    ro.observe(parent);
    return () => ro.disconnect();
  }, [width]);
  const w = width === "fill" ? fillW : width;
  const scale = w / 1280;
  const inner = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(800);
  useEffect(() => {
    if (height !== "auto" || !inner.current) return;
    const el = inner.current;
    const ro = new ResizeObserver(() => setAuto(el.scrollHeight * scale));
    ro.observe(el);
    return () => ro.disconnect();
  }, [height, scale]);
  return (
    <div ref={outer} data-template-preview data-preview-live={live} onPointerEnter={()=>setHovered(true)} onPointerLeave={()=>setHovered(false)} className="relative overflow-hidden" style={{ width: w, height: height === "auto" ? auto : height }} aria-hidden={height==="auto"?undefined:true}>
      <div ref={inner} className={`${height==="auto"?"pointer-events-auto":"pointer-events-none"} absolute left-0 top-0 origin-top-left`} style={{ width: 1280, transform: `scale(${scale})` }}>
        <PortfolioSite portfolio={live?p:still} embedded />
      </div>
    </div>
  );
}

