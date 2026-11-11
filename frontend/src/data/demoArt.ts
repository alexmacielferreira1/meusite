/** Arte de demonstração em SVG (data URL), sem fotos de terceiros.
 *  Cenas ilustradas próprias (paisagem, cidade, mar, retrato, palco, edição, jornal, áudio, dados, cartaz),
 *  escolhidas pelo tema do trabalho. Serve como capa em `coverStyle` e como `src` de <img>. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27")}`;

/** Sequência pseudoaleatória estável a partir do tom (mesma arte em toda renderização). */
function seq(seed: number) {
  let n = (seed * 9301 + 49297) % 233280;
  return () => (n = (n * 9301 + 49297) % 233280) / 233280;
}

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(((h % 360) + 360) % 360)} ${s}% ${l}%)`;

/** Pessoa vista de costas ou de frente, com luz de recorte: cabeça, cabelo, pescoço e ombros. */
function person(x: number, y: number, size: number, body: string, rim: string) {
  const r = size * 0.22;
  return `<g transform='translate(${x} ${y})'>`
    + `<path d='M${-size * 0.55} ${size} C${-size * 0.5} ${size * 0.45} ${-size * 0.28} ${size * 0.32} 0 ${size * 0.32} C${size * 0.28} ${size * 0.32} ${size * 0.5} ${size * 0.45} ${size * 0.55} ${size} Z' fill='${body}'/>`
    + `<rect x='${-r * 0.42}' y='${size * 0.16}' width='${r * 0.84}' height='${size * 0.2}' fill='${body}'/>`
    + `<circle cx='0' cy='0' r='${r}' fill='${body}'/>`
    + `<path d='M${-r} ${-r * 0.1} C${-r} ${-r * 1.25} ${r} ${-r * 1.35} ${r * 1.05} ${-r * 0.05} C${r * 0.6} ${-r * 0.7} ${-r * 0.5} ${-r * 0.75} ${-r} ${-r * 0.1} Z' fill='${body}' opacity='.9'/>`
    + `<path d='M${r * 0.92} ${-r * 0.35} A${r} ${r} 0 0 1 ${r * 0.55} ${r * 0.85}' stroke='${rim}' stroke-width='${Math.max(2, size * 0.02)}' fill='none' opacity='.85'/>`
    + `<path d='M${size * 0.5} ${size * 0.62} C${size * 0.42} ${size * 0.42} ${size * 0.2} ${size * 0.34} 0 ${size * 0.33}' stroke='${rim}' stroke-width='${Math.max(2, size * 0.018)}' fill='none' opacity='.6'/>`
    + `</g>`;
}

type Scene = (h: number, s: number, rnd: () => number) => string;

const SCENES: Record<string, Scene> = {
  /** Pôr do sol com montanhas em camadas e reflexo na água. */
  landscape: (h, s, rnd) => {
    const sun = 140 + rnd() * 360;
    const ridge = (base: number, amp: number, fill: string) => {
      let d = `M0 ${base}`;
      for (let x = 0; x <= 640; x += 80) d += ` L${x} ${base - amp * (0.4 + rnd() * 0.6)}`;
      return `<path d='${d} L640 400 L0 400 Z' fill='${fill}'/>`;
    };
    return `<defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${hsl(h + 220, s * 0.6, 22)}'/><stop offset='.6' stop-color='${hsl(h + 20, s, 55)}'/><stop offset='1' stop-color='${hsl(h + 40, s, 72)}'/></linearGradient></defs>`
      + `<rect width='640' height='400' fill='url(#sky)'/><circle cx='${sun}' cy='225' r='46' fill='${hsl(h + 45, s, 82)}'/>`
      + ridge(250, 120, hsl(h + 250, s * 0.35, 34)) + ridge(285, 90, hsl(h + 250, s * 0.4, 22)) + ridge(320, 60, hsl(h + 250, s * 0.45, 13))
      + `<rect y='330' width='640' height='70' fill='${hsl(h + 220, s * 0.4, 18)}'/><rect x='${sun - 40}' y='336' width='80' height='4' fill='${hsl(h + 45, s, 75)}' opacity='.7'/><rect x='${sun - 24}' y='350' width='48' height='3' fill='${hsl(h + 45, s, 75)}' opacity='.5'/>`;
  },
  /** Cidade à noite: prédios com janelas acesas e brilho no horizonte. */
  city: (h, s, rnd) => {
    let towers = "";
    for (let x = 0; x < 640;) {
      const w = 34 + rnd() * 46, top = 110 + rnd() * 170;
      towers += `<rect x='${x}' y='${top}' width='${w}' height='${400 - top}' fill='${hsl(h + 230, s * 0.3, 10 + rnd() * 8)}'/>`;
      for (let wy = top + 12; wy < 380; wy += 18) for (let wx = x + 6; wx < x + w - 8; wx += 12) if (rnd() > 0.62) towers += `<rect x='${wx}' y='${wy}' width='5' height='8' fill='${hsl(h + 40, s, 70)}' opacity='.85'/>`;
      x += w + 4;
    }
    return `<defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${hsl(h + 240, s * 0.5, 12)}'/><stop offset='1' stop-color='${hsl(h + 300, s, 42)}'/></linearGradient></defs>`
      + `<rect width='640' height='400' fill='url(#n)'/>${towers}`;
  },
  /** Mar com ondas e uma pessoa surfando. */
  // Mar sempre azul: o tom do trabalho só varia levemente a cor.
  sea: (tone, s) => { const h = tone % 25; return `<defs><linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${hsl(h + 190, s, 70)}'/><stop offset='.45' stop-color='${hsl(h + 195, s, 52)}'/><stop offset='1' stop-color='${hsl(h + 205, s, 24)}'/></linearGradient></defs>`
    + `<rect width='640' height='400' fill='url(#w)'/><rect width='640' height='150' fill='${hsl(h + 195, s * 0.6, 82)}' opacity='.55'/>`
    + `<path d='M0 250 C120 170 260 170 380 230 C470 270 560 250 640 210 L640 400 L0 400 Z' fill='${hsl(h + 200, s, 32)}'/>`
    + `<path d='M0 250 C120 170 260 170 380 230' stroke='white' stroke-width='10' fill='none' opacity='.8'/>`
    + `<g transform='translate(300 168) rotate(-12)'><rect x='-46' y='34' width='92' height='9' rx='5' fill='${hsl(h + 30, s, 60)}'/><circle cx='0' cy='-12' r='9' fill='#1b1b1b'/><path d='M-8 -2 L8 -2 L14 32 L-14 32 Z' fill='#1b1b1b'/><path d='M-8 4 L-30 16 M8 4 L30 -4' stroke='#1b1b1b' stroke-width='6'/></g>`; },
  /** Retrato com luz de recorte, fundo desfocado. */
  portrait: (h, s, rnd) => `<defs><radialGradient id='p' cx='.7' cy='.3' r='.9'><stop offset='0' stop-color='${hsl(h, s, 58)}'/><stop offset='1' stop-color='${hsl(h + 30, s * 0.6, 12)}'/></radialGradient></defs>`
    + `<rect width='640' height='400' fill='url(#p)'/><circle cx='${120 + rnd() * 80}' cy='90' r='60' fill='${hsl(h + 40, s, 75)}' opacity='.25'/><circle cx='560' cy='320' r='80' fill='${hsl(h + 200, s, 60)}' opacity='.18'/>`
    + person(380, 120, 300, hsl(h + 20, 25, 8), hsl(h + 40, s, 78)),
  /** Palco com refletores e público. */
  stage: (h, s, rnd) => {
    let crowd = "";
    for (let x = -10; x < 660; x += 26) crowd += `<circle cx='${x}' cy='${352 + rnd() * 10}' r='15' fill='#0b0b0f'/><rect x='${x - 14}' y='${360 + rnd() * 6}' width='28' height='60' rx='10' fill='#0b0b0f'/>`;
    return `<rect width='640' height='400' fill='${hsl(h + 260, s * 0.5, 10)}'/>`
      + `<path d='M150 0 L60 330 L260 330 Z' fill='${hsl(h, s, 70)}' opacity='.28'/><path d='M490 0 L380 330 L580 330 Z' fill='${hsl(h + 60, s, 70)}' opacity='.28'/><path d='M320 0 L250 330 L390 330 Z' fill='white' opacity='.18'/>`
      + `<rect y='300' width='640' height='40' fill='${hsl(h + 260, s * 0.4, 18)}'/>` + person(320, 200, 120, "#09090c", hsl(h, s, 75)) + crowd;
  },
  /** Ilha de edição: monitores com imagem e linha do tempo. */
  edit: (h, s, rnd) => {
    let clips = "";
    for (let row = 0; row < 3; row++) for (let x = 40; x < 600;) { const w = 40 + rnd() * 110; clips += `<rect x='${x}' y='${300 + row * 22}' width='${w - 4}' height='16' rx='3' fill='${hsl(h + row * 70, s, 55)}' opacity='.9'/>`; x += w; }
    return `<rect width='640' height='400' fill='${hsl(h + 230, 20, 9)}'/>`
      + `<rect x='40' y='40' width='330' height='200' rx='6' fill='${hsl(h + 230, 15, 16)}'/><rect x='52' y='52' width='306' height='176' fill='${hsl(h, s, 45)}'/><circle cx='250' cy='130' r='40' fill='${hsl(h + 40, s, 72)}' opacity='.7'/><path d='M52 228 L150 150 L230 200 L300 160 L358 228 Z' fill='${hsl(h + 200, s * 0.5, 22)}'/>`
      + `<rect x='390' y='40' width='210' height='120' rx='6' fill='${hsl(h + 230, 15, 16)}'/><rect x='402' y='52' width='186' height='96' fill='${hsl(h + 180, s * 0.6, 30)}'/>`
      + `<rect x='390' y='170' width='210' height='70' rx='6' fill='${hsl(h + 230, 15, 14)}'/><path d='M400 220 L430 190 L460 210 L490 180 L520 200 L560 176 L590 196' stroke='${hsl(h + 120, s, 60)}' stroke-width='3' fill='none'/>`
      + `<rect x='30' y='290' width='580' height='80' rx='6' fill='${hsl(h + 230, 15, 13)}'/>${clips}<rect x='${180 + rnd() * 260}' y='284' width='2' height='92' fill='#ff4d4d'/>`;
  },
  /** Página de jornal com manchete e foto. */
  newspaper: (h, s, rnd) => {
    let lines = "";
    for (let y = 250; y < 380; y += 14) lines += `<rect x='40' y='${y}' width='${180 + rnd() * 90}' height='6' fill='#3a3a3a' opacity='.55'/><rect x='340' y='${y - 120}' width='${200 + rnd() * 60}' height='6' fill='#3a3a3a' opacity='.55'/>`;
    return `<rect width='640' height='400' fill='#f3efe6'/><rect x='40' y='30' width='560' height='34' fill='#1d1d1d'/><rect x='40' y='76' width='420' height='16' fill='#1d1d1d' opacity='.8'/><rect x='40' y='100' width='300' height='16' fill='#1d1d1d' opacity='.8'/>`
      + `<rect x='40' y='130' width='280' height='110' fill='${hsl(h, s * 0.5, 45)}'/><path d='M40 240 L120 180 L190 215 L250 170 L320 240 Z' fill='${hsl(h + 200, s * 0.4, 25)}'/>${lines}`;
  },
  /** Onda sonora com microfone. */
  waveform: (h, s, rnd) => {
    let bars = "";
    for (let x = 30; x < 610; x += 12) { const hgt = 10 + Math.abs(Math.sin(x / 37)) * 120 * (0.4 + rnd() * 0.6); bars += `<rect x='${x}' y='${200 - hgt / 2}' width='6' height='${hgt}' rx='3' fill='${hsl(h + x / 4, s, 62)}'/>`; }
    return `<defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${hsl(h + 250, s * 0.6, 14)}'/><stop offset='1' stop-color='${hsl(h + 300, s * 0.7, 26)}'/></linearGradient></defs>`
      + `<rect width='640' height='400' fill='url(#a)'/>${bars}`
      + `<g transform='translate(560 300)'><rect x='-16' y='-60' width='32' height='60' rx='16' fill='#e9e9ee'/><path d='M-26 -20 C-26 10 26 10 26 -20' stroke='#e9e9ee' stroke-width='5' fill='none'/><rect x='-2' y='4' width='4' height='26' fill='#e9e9ee'/></g>`;
  },
  /** Gráficos de dados. */
  chart: (h, s, rnd) => {
    let bars = "";
    for (let i = 0; i < 8; i++) { const v = 40 + rnd() * 170; bars += `<rect x='${60 + i * 44}' y='${330 - v}' width='28' height='${v}' rx='4' fill='${hsl(h + i * 12, s, 52)}'/>`; }
    return `<rect width='640' height='400' fill='#f6f7fb'/><rect x='40' y='40' width='400' height='310' rx='12' fill='white'/>${bars}`
      + `<rect x='460' y='40' width='140' height='145' rx='12' fill='white'/><circle cx='530' cy='112' r='48' fill='${hsl(h + 180, s, 55)}'/><path d='M530 112 L530 64 A48 48 0 0 1 576 124 Z' fill='${hsl(h, s, 52)}'/>`
      + `<rect x='460' y='205' width='140' height='145' rx='12' fill='white'/><path d='M475 320 L505 280 L535 296 L565 240 L590 255' stroke='${hsl(h + 90, s, 45)}' stroke-width='4' fill='none'/>`;
  },
  /** Cartaz gráfico (identidade visual, ilustração, motion). */
  poster: (h, s, rnd) => `<rect width='640' height='400' fill='${hsl(h, s, 52)}'/>`
    + `<circle cx='${200 + rnd() * 120}' cy='180' r='120' fill='${hsl(h + 180, s, 60)}'/><rect x='330' y='60' width='190' height='190' fill='${hsl(h + 40, s, 25)}' transform='rotate(${rnd() * 30} 425 155)'/>`
    + `<path d='M0 400 L260 230 L420 400 Z' fill='${hsl(h + 90, s, 35)}' opacity='.9'/><rect x='420' y='300' width='180' height='14' fill='white'/><rect x='420' y='324' width='120' height='14' fill='white' opacity='.75'/>`,
};

const KEYWORDS: [string, RegExp][] = [
  ["newspaper", /reportag|matéria|materia|artigo|jornal|clipping|release|crônica|cronica|coluna|notícia|noticia|imprensa|edição impressa|perfil escrito|especial/i],
  ["waveform", /podcast|áudio|audio|locução|locucao|spot|vinheta|sonor|rádio|radio|demo|trilha|narra/i],
  ["chart", /dados|infográf|infograf|relatório|relatorio|dashboard|indicador|resultado|métrica|metrica|pesquisa/i],
  ["stage", /show|clipe|música|musica|banda|cantor|turnê|turne|evento|palco|ao vivo|festival|congresso|cobertura|apresenta|mediação|mediacao|talk|painel|lançamento|lancamento/i],
  ["sea", /esporte|surf|mar\b|praia|onda|aventura|outdoor/i],
  ["city", /cidade|urban|noturn|drama|mobilidade|thriller|ficção|ficcao|série|serie|curta/i],
  ["portrait", /entrevista|retrato|novela|depoimento|perfil|ensaio|personagem|moda|casamento|família|familia|bastidor/i],
  ["edit", /edição|edicao|montagem|trailer|promo|cor|color|vfx|efeito|finaliza|teaser|reel|making/i],
  ["landscape", /documentário|documentario|natureza|viagem|filme de marca|turismo|rota|território|territorio|paisagem|institucional|costa|serra|campo/i],
  ["poster", /identidade|cartaz|branding|design|ilustra|motion|anima|campanha|peça|peca|ux|interface|app|site|produto|educa|curso|marca/i],
];
const ORDER = ["landscape", "city", "portrait", "edit", "sea", "stage", "poster", "newspaper", "waveform", "chart"];

/** Escolhe a cena pelo tema do trabalho; sem pista, varia pelo tom. */
export function sceneFor(hue: number, hint = "", kind = "") {
  // Jornal só para matéria escrita e onda sonora só para áudio; vídeo de reportagem ganha cena de imagem.
  const fits = ([scene]: [string, RegExp]) => (scene !== "newspaper" || kind === "a") && (scene !== "waveform" || kind === "s");
  const found = KEYWORDS.filter(fits).find(([, pattern]) => pattern.test(hint))?.[0];
  if (found) return found;
  if (kind === "a") return "newspaper";
  if (kind === "s") return "waveform";
  const pool = ORDER.filter((scene) => scene !== "newspaper" && scene !== "waveform" && scene !== "chart");
  return pool[Math.abs(Math.round(hue)) % pool.length];
}

/** Retrato fictício: pessoa com luz de recorte sobre fundo desfocado. */
export function demoPortrait(hue: number): string {
  return toDataUrl(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'>`
    + `<defs><radialGradient id='l' cx='.75' cy='.3' r='.8'><stop offset='0' stop-color='${hsl(hue, 60, 58)}'/><stop offset='1' stop-color='${hsl(hue, 45, 14)}'/></radialGradient></defs>`
    + `<rect width='600' height='600' fill='url(#l)'/><circle cx='120' cy='120' r='70' fill='${hsl(hue + 40, 70, 75)}' opacity='.2'/>`
    + person(310, 190, 440, hsl(hue, 25, 9), hsl(hue + 30, 70, 78))
    + `</svg>`);
}

/** Capa ilustrada. `hint` (categoria/título) e `kind` (v, i, a, s, r) escolhem a cena; `saturation` 0 deixa em preto e branco. */
export function demoArt(hue: number, label = "", saturation = 68, hint = "", kind = ""): string {
  const scene = SCENES[sceneFor(hue, hint, kind)];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 400'>`
    + scene(hue, saturation, seq(Math.round(hue) + 1))
    + (label ? `<rect x='0' y='330' width='640' height='70' fill='black' opacity='.35'/><text x='32' y='376' font-family='sans-serif' font-size='30' font-weight='700' fill='white'>${esc(label)}</text>` : "")
    + `</svg>`;
  // Parênteses e aspas também são codificados para funcionar dentro de url() no CSS.
  return toDataUrl(svg);
}
