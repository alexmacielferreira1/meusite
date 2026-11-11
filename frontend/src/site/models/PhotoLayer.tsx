import { useContext, useId, type CSSProperties, type ImgHTMLAttributes, type ReactNode } from "react";
import { lookOf } from "../../data/templateLooks";
import { DEFAULT_LOOK, isRealPhoto, lookFilter } from "../../lib/photoLook";
import { colorMatrix } from "../../lib/photoStats";
import { usePhotoCorrection } from "../../lib/usePhotoCorrection";
import { coverStyle } from "../../lib/utils";
import { SiteContext } from "../kit";

/** true quando a pessoa ligou o acabamento e a imagem é uma foto real. */
export function useLookOn(src?: string) {
  const ctx = useContext(SiteContext);
  return !!(ctx?.p.site.photoLook?.enabled && isRealPhoto(src));
}

/** Filtro, camada de cor e <svg> da correção, compartilhados por PhotoLayer e PhotoImg.
 *  Brilho e contraste da correção vão só no CSS; os ganhos de cor, só no feColorMatrix. */
function useLookStyle(src: string) {
  const ctx = useContext(SiteContext)!;
  const look = { ...DEFAULT_LOOK, ...ctx.p.site.photoLook };
  const fix = usePhotoCorrection(src, look.autoFix);
  const id = `fx${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const { filter, overlay } = lookFilter(lookOf(ctx.p.site.templateId), look.intensity, ctx.theme.accent);
  const all = [fix && `url(#${id}) brightness(${fix.brightness}) contrast(${fix.contrast})`, filter].filter(Boolean).join(" ") || undefined;
  const svg = fix && (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={id} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={colorMatrix(fix)} /></filter>
    </svg>
  );
  return { filter: all, overlay, svg };
}

/** Foto numa camada própria, atrás dos filhos, com o filtro do modelo e a correção da foto. */
export function PhotoLayer({ src, position }: { src: string; position?: string }) {
  const { filter, overlay, svg } = useLookStyle(src);
  return (
    <>
      {svg}
      <span aria-hidden data-photo-layer className="pointer-events-none absolute inset-0 -z-10"
        style={{ ...coverStyle(src), ...(position && { backgroundPosition: position }), filter }} />
      {overlay && <span aria-hidden data-photo-overlay className="pointer-events-none absolute inset-0 -z-10" style={overlay} />}
    </>
  );
}

/** <img> de conteúdo da pessoa. Desligado (ou arte de demonstração), é o <img> original. Ligado, recebe o
 *  mesmo filtro; com camada de cor (duotone, vinheta) vai num invólucro que leva os cantos arredondados. */
export function PhotoImg(props: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const on = useLookOn(props.src);
  return on ? <LookImg {...props} /> : <img {...props} />;
}

function LookImg({ style, className = "", ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const { filter, overlay, svg } = useLookStyle(rest.src);
  const img = <img {...rest} className={className} style={{ ...style, filter }} />;
  if (!overlay) return <>{svg}{img}</>;
  const round = className.match(/rounded-\S+/g)?.join(" ") ?? "";
  return (
    <span className={`relative isolate block overflow-hidden ${round}`}>
      {svg}{img}<span aria-hidden data-photo-overlay className="pointer-events-none absolute inset-0" style={overlay} />
    </span>
  );
}

/** Elemento com foto de fundo das seções do modelo livre. Desligado, renderiza exatamente o elemento
 *  original (`base` substitui o estilo de capa quando o original não usava coverStyle). Ligado, a foto
 *  vai para a camada de acabamento e o elemento ganha "isolate" (e "relative", se não for posicionado). `offClass` só vale desligado. */
export function Photo({ src, className = "", offClass = "", style, base, as: Tag = "div", onClick, children }: {
  src: string; className?: string; offClass?: string; style?: CSSProperties; base?: CSSProperties; as?: "div" | "span" | "button"; onClick?: () => void; children?: ReactNode;
}) {
  const on = useLookOn(src);
  if (!on) return <Tag className={offClass ? `${className} ${offClass}` : className} style={{ ...(base ?? coverStyle(src)), ...style }} onClick={onClick}>{children}</Tag>;
  const pos = /\b(absolute|fixed|relative|sticky)\b/.test(className) ? "" : "relative ";
  return <Tag className={`${pos}overflow-hidden isolate ${className}`} style={style} onClick={onClick}><PhotoLayer src={src} />{children}</Tag>;
}
