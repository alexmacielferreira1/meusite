import { BLOCKS, type BlockId } from "./blocks";
import { MODEL_SECTIONS } from "./modelBlocks";

/**
 * Ordem dos blocos escolhida pela pessoa. Os modelos desenham as seções numa ordem fixa; aqui as seções
 * de blocos trocam de lugar entre si (CSS order), enquanto topo, contato e seções próprias do modelo ficam onde estão.
 */
const IDS = BLOCKS.map((b) => b.id);
const FIXED_SECTIONS = new Set(["inicio", "contato"]);

/** Ordem completa: a escolhida primeiro, depois os blocos que faltarem na ordem padrão. */
export function fullOrder(order?: BlockId[]): BlockId[] {
  const chosen = [...new Set((order ?? []).filter((id) => IDS.includes(id)))];
  return [...chosen, ...IDS.filter((id) => !chosen.includes(id))];
}

/** All native sibling sections belonging to a content block, including split layouts. */
export const ORDER_SECTIONS: Record<string, Partial<Record<BlockId, string[]>>> = {
  "editor-pro": {
    "works": [
      "reel",
      "trabalhos"
    ]
  },
  "producao-audiovisual": {
    "works": [
      "producoes",
      "bastidores"
    ]
  },
  "motion-design": {
    "works": [
      "reel",
      "projetos"
    ]
  },
  "jornalismo": {
    "clipping": [
      "reportagens",
      "mais-reportagens"
    ]
  },
  "documentarista": {
    "works": [
      "destaque",
      "sobre-trajetoria"
    ]
  },
  "reporter-tv": {
    "works": [
      "destaque",
      "reportagens"
    ]
  },
  "podcast-producao-sonora": {
    "audio": [
      "destaque",
      "series",
      "producao"
    ],
    "works": [
      "series",
      "producao"
    ],
    "clipping": [
      "series",
      "producao"
    ]
  },
  "cobertura-eventos": {
    "works": [
      "destaque",
      "projetos"
    ]
  },
  "comunicacao-corporativa": {
    "works": [
      "cases",
      "entregas"
    ]
  },
  "colorista": {
    "works": [
      "cor",
      "projetos"
    ]
  },
  "efeitos-visuais": {
    "works": [
      "breakdown",
      "shots"
    ]
  },
  "roteiro-audiovisual": {
    "works": [
      "projetos",
      "trecho"
    ]
  },
  "fotojornalismo": {
    "clipping": [
      "reportagens",
      "veiculos"
    ]
  },
  "design-informacao": {
    "works": [
      "projetos",
      "destaque"
    ]
  },
  "apresentacao-mediacao": {
    "works": [
      "agenda",
      "eventos"
    ]
  },
  "ux-writing": {
    "works": [
      "antes-depois",
      "projetos"
    ]
  },
  "vitrine-multidisciplinar": {
    "works": [
      "areas",
      "projetos"
    ],
    "clipping": [
      "areas",
      "projetos"
    ]
  },
  "arquivo-editorial": {
    "clipping": [
      "inicio",
      "arquivo"
    ]
  },
  "campanhas-resultados": {
    "works": [
      "pecas",
      "resultados"
    ]
  },
  "impacto": {
    "works": [
      "reel",
      "trabalhos"
    ]
  },
  "case-em-profundidade": {
    "works": [
      "inicio",
      "case"
    ]
  }
};

export function sectionsOf(templateId: string, block: BlockId): string[] {
  return ORDER_SECTIONS[templateId]?.[block] ?? (MODEL_SECTIONS[templateId]?.[block] ? [MODEL_SECTIONS[templateId][block]!] : []);
}
export function fixedBlocks(templateId: string): BlockId[] {
  return IDS.filter((block) => { const ids = sectionsOf(templateId, block); return ids.length > 0 && ids.every((id) => FIXED_SECTIONS.has(id)); });
}
/** Native content sharing a section must move together, as the editor explains. */
export function linkedBlocks(templateId: string, block: BlockId): BlockId[] {
  const group = new Set<BlockId>([block]);
  let grew = true;
  while (grew) {
    grew = false;
    const sections = [...group].flatMap((id) => sectionsOf(templateId, id)).filter((id) => !FIXED_SECTIONS.has(id));
    for (const other of IDS) if (!group.has(other) && sectionsOf(templateId, other).some((id) => sections.includes(id))) { group.add(other); grew = true; }
  }
  return IDS.filter((other) => other !== block && group.has(other));
}
function blocksOf(child: { id: string; block?: string }, templateId: string): BlockId[] {
  if (child.block) return [child.block as BlockId];
  if (!child.id || FIXED_SECTIONS.has(child.id)) return [];
  return IDS.filter((block) => sectionsOf(templateId, block).includes(child.id));
}
/** Preserve hero/contact slots. Connected split sections move as one content group. */
export function arrange(children: { id: string; block?: string }[], templateId: string, order?: BlockId[]): number[] {
  const rank = fullOrder(order);
  const movable = children.map((child, index) => ({ index, blocks: blocksOf(child, templateId) })).filter((item) => item.blocks.length);
  const slots = movable.map((item) => item.index);
  const groups: typeof movable[] = [];
  for (const item of movable) {
    const matches = groups.filter((group) => group.some((other) => other.blocks.some((block) => item.blocks.includes(block))));
    if (!matches.length) groups.push([item]);
    else {
      matches[0].push(item);
      for (const group of matches.slice(1)) { matches[0].push(...group); groups.splice(groups.indexOf(group), 1); }
    }
  }
  const priority = (group: typeof movable) => Math.min(...group.flatMap((item) => item.blocks.map((id) => rank.indexOf(id))));
  groups.sort((a, b) => priority(a) - priority(b));
  const result = children.map((_, i) => i);
  groups.flatMap((group) => group.sort((a, b) => a.index - b.index)).forEach((item, k) => { result[item.index] = slots[k]; });
  return result;
}
