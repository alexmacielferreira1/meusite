import { AudioLines, Box, Camera, Code2, Film, Palette, Scissors, Sparkles, Wrench, type LucideIcon } from "lucide-react";

/**
 * Ícones próprios por tipo de ferramenta (não usamos logos de marcas: as marcas restringem esse uso).
 * A cor identifica a família: edição, motion/3D, áudio, design, foto, código.
 */
interface Family { icon: LucideIcon; color: string; label: string; match: RegExp }

export const SOFTWARE_FAMILIES: Family[] = [
  { label: "Edição de vídeo", icon: Scissors, color: "#7c3aed", match: /premiere|final ?cut|davinci|resolve|avid|media composer|vegas|capcut|kdenlive|edius|lumafusion|imovie/i },
  { label: "Motion, VFX e 3D", icon: Sparkles, color: "#ea580c", match: /after ?effects|nuke|fusion|houdini|maya|blender|cinema ?4d|c4d|unreal|mocha|motion|3ds|zbrush|substance|redshift|octane/i },
  { label: "Áudio", icon: AudioLines, color: "#059669", match: /audition|pro ?tools|logic|reaper|ableton|audacity|fl studio|izotope|cubase|garageband/i },
  { label: "Design e imagem", icon: Palette, color: "#db2777", match: /photoshop|illustrator|indesign|figma|canva|affinity|corel|xd\b|sketch|procreate/i },
  { label: "Foto", icon: Camera, color: "#0d9488", match: /lightroom|capture ?one|bridge/i },
  { label: "Código e dados", icon: Code2, color: "#2563eb", match: /python|javascript|typescript|html|css|react|node|git|sql|django|flask|vercel|jquery|java\b|php|pandas|excel|power ?bi|docker/i },
  { label: "Finalização e entrega", icon: Film, color: "#475569", match: /media encoder|encoder|handbrake|frame\.io|compressor/i },
  { label: "Outras ferramentas", icon: Wrench, color: "#64748b", match: /.*/ },
];

export const softwareFamily = (name: string) => SOFTWARE_FAMILIES.find((family) => family.match.test(name))!;

/** Nome do software com ícone da família. Herda a cor do texto: serve em fundo claro e escuro. */
export function SoftwareChip({ name }: { name: string }) {
  const family = softwareFamily(name);
  const Icon = family.icon === Wrench && /plugin|lut/i.test(name) ? Box : family.icon;
  return (
    <span title={family.label} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `color-mix(in srgb, ${family.color} 16%, transparent)`, borderColor: `color-mix(in srgb, ${family.color} 35%, transparent)` }}>
      <Icon size={13} style={{ color: family.color }} aria-hidden />{name}
    </span>
  );
}

/** Atividades do campo Função: "Edição, Finalização; Sonorização" → ["Edição", "Finalização", "Sonorização"]. */
export const activities = (role: string) => role.split(/[,;•|]/).map((part) => part.trim()).filter(Boolean);
