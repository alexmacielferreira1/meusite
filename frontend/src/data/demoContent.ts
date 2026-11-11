import { MOTION_DESIGNS } from "./motionDesigns";
import type { Portfolio, RoleId, Work, WorkKind } from "../types/portfolio";
import { slugify, uid } from "../lib/utils";
import { demoArt } from "./demoArt";
import { exampleCover, examplePortrait } from "./demoMedia";
import { sectionsFrom } from "./seed";
import { templateById } from "./templates";

/** Conteúdo de EXEMPLO por modelo, só para a galeria. Pessoas, clientes e veículos são fictícios. */

type K = "v" | "i" | "a" | "u" | "s";
/** [título, tipo, categoria, cliente ou veículo, ano, matiz da capa, descrição, campos extras] */
type W = [string, K, string, string, string, number, string, Partial<Work>?];

interface Spec {
  name: string;
  headline: string;
  role: RoleId;
  city: string;
  bio: string;
  stats: [string, string][];
  works: W[];
  pillars?: [string, string][];
  clients?: string[];
  services?: [string, string, string?][];
  experience?: [string, string, string][];
  education?: [string, string, string][];
  testimonials?: [string, string, string][];
  team?: [string, string][];
  faq?: [string, string][];
  /** capas em preto e branco */
  mono?: boolean;
}

const KIND: Record<K, WorkKind> = { v: "video", i: "image", a: "article", u: "audio", s: "script" };

const SPECS: Record<string, Spec> = {
  "editor-pro": {
    name: "Rafa Moreno", headline: "Edição que conta histórias", role: "editor", city: "São Paulo/SP",
    bio: "Monto filmes, séries e campanhas há 11 anos. Cuido do ritmo, da cor e da finalização para que a história chegue inteira ao público.",
    stats: [["11+", "anos de edição"], ["280", "projetos finalizados"], ["4", "séries documentais"]],
    pillars: [["Montagem", "Estrutura narrativa e ritmo para cinema, TV e web."], ["Finalização", "Cor, legendas e masters para cada plataforma."], ["Pós-produção", "Organização de material bruto e fluxo com a equipe."]],
    works: [
      ["Reel de edição 2026", "v", "Reel", "Seleção pessoal", "2026", 265, "Dois minutos com os cortes mais marcantes dos últimos três anos.", { featured: true }],
      ["Entre Serras", "v", "Documentário", "Produtora Vale Alto", "2025", 200, "Longa documental de 82 minutos montado a partir de 140 horas de material."],
      ["Linha Urbana", "v", "Publicidade", "Mobilidade Rota", "2025", 330, "Filme de 30 segundos e seis versões para redes."],
      ["Raiz", "v", "Videoclipe", "Banda Maré Cheia", "2024", 15, "Videoclipe de 4 minutos com montagem rítmica e cor quente."],
    ],
    clients: ["Produtora Vale Alto", "Mobilidade Rota", "Canal Horizonte", "Estúdio Faro", "Banda Maré Cheia"],
    experience: [["2020 — hoje", "Editor e finalizador", "Freelancer"], ["2015 — 2020", "Editor", "Produtora Vale Alto"]],
    education: [["2014", "Cinema e Audiovisual", "Faculdade (exemplo)"]],
  },
  "grade-suica": {
    name: "Helena Brandt", headline: "Identidade visual com rigor e clareza", role: "designer", city: "Curitiba/PR",
    bio: "Desenho sistemas de identidade, sinalização e editoriais em grade. Prefiro poucas cores, tipografia precisa e decisões justificadas.",
    stats: [["9", "anos de estúdio"], ["60+", "identidades"], ["3", "prêmios de design"]],
    pillars: [["Identidade", "Marcas e sistemas visuais completos."], ["Editorial", "Livros, revistas e relatórios."], ["Sinalização", "Projetos de orientação em espaços públicos."]],
    works: [
      ["Museu da Ferrovia", "i", "Sinalização", "Museu da Ferrovia", "2025", 5, "Sistema de sinalização bilíngue com 140 placas.", { featured: true }],
      ["Café Planalto", "i", "Identidade", "Café Planalto", "2025", 32, "Marca, embalagens e cardápio."],
      ["Revista Contorno", "i", "Editorial", "Revista Contorno", "2024", 220, "Projeto gráfico de revista trimestral de arquitetura."],
      ["Bienal de Cartazes", "i", "Cartaz", "Bienal de Cartazes", "2024", 350, "Série de cinco cartazes tipográficos."],
    ],
    services: [["Identidade visual", "Marca, manual e aplicações."], ["Projeto editorial", "Grade, tipografia e diagramação."], ["Sinalização", "Estudo de fluxo e família de placas."]],
    clients: ["Museu da Ferrovia", "Café Planalto", "Revista Contorno", "Bienal de Cartazes"],
  },
  "editorial": {
    name: "Clara Vasconcelos", headline: "Reportagem sobre cidades, moradia e clima", role: "jornalista", city: "Recife/PE",
    bio: "Sou repórter há 10 anos. Escrevo reportagens longas sobre como as cidades mudam e quem paga por essas mudanças.",
    stats: [["10", "anos de redação"], ["320", "reportagens"], ["2", "prêmios"]],
    pillars: [["Reportagem", "Apuração de campo e dados públicos."], ["Edição", "Textos longos e séries especiais."], ["Dados", "Planilhas, mapas e checagem."]],
    works: [
      ["A maré que avança", "a", "Clima", "Jornal Capibaribe", "2025", 195, "Série em quatro partes sobre bairros afetados pela subida do mar.", { outlet: "Jornal Capibaribe", featured: true }],
      ["Quem mora no centro", "a", "Moradia", "Revista Trama", "2025", 30, "Reportagem sobre prédios vazios e ocupações.", { outlet: "Revista Trama" }],
      ["O preço do ônibus", "a", "Mobilidade", "Portal Nordeste Agora", "2024", 260, "Levantamento de tarifas em 12 capitais.", { outlet: "Portal Nordeste Agora" }],
    ],
    experience: [["2019 — hoje", "Repórter especial", "Jornal Capibaribe"], ["2015 — 2019", "Repórter", "Portal Nordeste Agora"]],
    education: [["2014", "Jornalismo", "Universidade (exemplo)"]],
  },
  "impacto": {
    name: "Tom Aguiar", headline: "Motion e 3D para marcas que querem ser lembradas", role: "motion", city: "Belo Horizonte/MG",
    bio: "Crio animações 2D e 3D, vinhetas e pacotes gráficos. Trabalho com agências e marcas que precisam de identidade em movimento.",
    stats: [["8", "anos de motion"], ["150", "animações"], ["12", "pacotes gráficos"]],
    works: [
      ["Motion reel 2026", "v", "Reel", "Seleção pessoal", "2026", 285, "Os melhores trechos do último ano.", { featured: true }],
      ["Lançamento Pulso", "v", "3D", "App Pulso", "2025", 175, "Filme 3D de 20 segundos para lançamento de aplicativo."],
      ["Vinheta Arena", "v", "Vinheta", "Canal Arena", "2025", 10, "Pacote de vinhetas e lower thirds."],
      ["Explicativo Verde", "v", "Explainer", "Cooperativa Verde", "2024", 120, "Animação 2D de 90 segundos."],
    ],
    services: [["Animação 2D", "Explainers, lettering e ilustração animada."], ["3D", "Produtos, logos e cenários."], ["Pacote gráfico", "Vinhetas, transições e lower thirds."]],
    testimonials: [["Entregou um pacote gráfico que virou a cara do canal.", "Coordenação de arte", "Canal Arena"]],
    clients: ["App Pulso", "Canal Arena", "Cooperativa Verde", "Agência Prisma"],
  },
  "documental": {
    name: "Iara Monteiro", headline: "Documentários sobre gente, território e memória", role: "produtor", city: "Belém/PA",
    bio: "Dirijo e produzo documentários na Amazônia há 12 anos, sempre com equipes locais e personagens que contam a própria história.",
    stats: [["12", "anos de documentário"], ["9", "filmes"], ["14", "festivais"]],
    pillars: [["Direção", "Pesquisa, roteiro e condução de entrevistas."], ["Produção", "Logística em campo e equipes locais."], ["Distribuição", "Festivais, TV pública e escolas."]],
    works: [
      ["Vozes do Igarapé", "v", "Documentário", "TV Pública Norte", "2025", 160, "Longa de 70 minutos sobre ribeirinhos e a pesca artesanal.", { featured: true }],
      ["Mãos de barro", "v", "Curta", "Fundo de Cultura", "2024", 25, "Curta sobre ceramistas de uma vila do Marajó."],
      ["Festa da colheita", "v", "Série", "Canal Raízes", "2023", 45, "Série em três episódios sobre festas populares."],
    ],
    experience: [["2018 — hoje", "Diretora", "Coletivo Margem Filmes"], ["2013 — 2018", "Produtora", "TV Pública Norte"]],
    clients: ["TV Pública Norte", "Canal Raízes", "Fundo de Cultura"],
  },
  "mosaico": {
    name: "Bia Kato", headline: "Conteúdo leve, colorido e que vende", role: "social", city: "Florianópolis/SC",
    bio: "Penso e produzo conteúdo para marcas de moda, beleza e bem-estar, do roteiro ao post publicado.",
    stats: [["6", "anos em social"], ["25", "marcas atendidas"], ["+210%", "alcance médio"]],
    works: [
      ["Coleção Brisa", "i", "Campanha", "Ateliê Brisa", "2025", 330, "Campanha de lançamento com 24 peças e 6 vídeos curtos.", { featured: true }],
      ["Rotina de pele", "v", "Reels", "Botica Lume", "2025", 300, "Série de vídeos verticais com especialistas.", { aspect: "9:16" }],
      ["Verão na praça", "i", "Evento", "Shopping Praça Sul", "2024", 40, "Cobertura de evento e conteúdo em tempo real."],
    ],
    services: [["Planejamento", "Calendário, pilares e metas."], ["Produção", "Fotos, vídeos curtos e textos."], ["Gestão", "Publicação, respostas e relatório mensal."]],
    testimonials: [["Nossas vendas pelo Instagram dobraram em seis meses.", "Sócia", "Ateliê Brisa"]],
    clients: ["Ateliê Brisa", "Botica Lume", "Shopping Praça Sul"],
  },
  "portfolio-compacto": {
    name: "Luísa Martins", headline: "Histórias, pessoas e projetos com propósito", role: "jornalista", city: "Campinas/SP",
    bio: "Jornalista e produtora de conteúdo. Recém-formada, com reportagens publicadas e um projeto multimídia autoral.",
    stats: [["2", "anos de experiência"], ["15", "reportagens"]],
    experience: [["2024 — hoje", "Repórter e produtora", "Revista Horizonte (exemplo)"], ["2021 — 2024", "Produtora de conteúdo", "Canal Ponto"], ["2019 — 2021", "Estagiária de jornalismo", "Agência Norte"]],
    works: [
      ["Rios que conectam", "v", "Reportagem multimídia", "Projeto autoral", "2025", 190, "Série sobre comunidades que vivem às margens de rios urbanos.", { featured: true }],
      ["Juventude e trabalho", "i", "Fotorreportagem", "Revista Universitária", "2024", 25, "Ensaio com jovens trabalhadores de aplicativos."],
    ],
  },
  "curriculo-com-trabalhos": {
    name: "Marcos Almeida", headline: "Jornalista e comunicador com 6 anos de experiência", role: "jornalista", city: "Belém/PA",
    bio: "Trabalho com reportagem, produção multimídia e comunicação digital, com foco em pautas de impacto social.",
    stats: [["6", "anos de experiência"], ["3", "redações"]],
    works: [
      ["O rio que sustenta a cidade", "v", "Reportagem", "Portal Contexto", "2023", 200, "Reportagem em vídeo sobre o abastecimento da cidade.", { featured: true }],
      ["Moradia no centro", "i", "Especial multimídia", "Portal Contexto", "2022", 30, "Especial com fotos, mapa e depoimentos."],
    ],
    experience: [["2022 — hoje", "Repórter", "Portal Contexto"], ["2020 — 2022", "Produtor de conteúdo", "TV Norte (exemplo)"], ["2018 — 2020", "Estagiário", "Jornal do Estado (exemplo)"]],
    education: [["2018", "Bacharelado em Jornalismo", "Universidade (exemplo)"]],
  },
  "arquivo-editorial": {
    name: "Ana Ribeiro", headline: "Jornalismo, sociedade e território", role: "jornalista", city: "Salvador/BA",
    bio: "Escrevo sobre agricultura, clima e cultura no interior do Nordeste. Este é o arquivo das minhas publicações desde 2019.",
    stats: [["7", "anos de reportagem"], ["180", "textos publicados"]],
    pillars: [["Campo", "Agricultura familiar e clima."], ["Cultura", "Festas, memória e patrimônio."], ["Dados", "Séries históricas e mapas."]],
    works: [
      ["O último engenho", "a", "Cultura", "Revista Observatório", "2025", 35, "A resistência de famílias que mantêm viva a cultura da cana.", { outlet: "Revista Observatório", featured: true }],
      ["Como o clima muda o campo", "a", "Clima", "Jornal do Sertão", "2025", 140, "Tecnologia, adaptação e os novos desafios da agricultura.", { outlet: "Jornal do Sertão" }],
      ["Jovens que ficaram", "a", "Sociedade", "Revista Observatório", "2024", 280, "Histórias de quem criou oportunidades no interior.", { outlet: "Revista Observatório" }],
      ["A escola do rio", "a", "Educação", "Portal Semiárido", "2024", 190, "Educação ribeirinha e o direito de aprender.", { outlet: "Portal Semiárido" }],
      ["Cidades mais frescas", "a", "Clima", "Jornal do Sertão", "2023", 100, "Soluções urbanas para enfrentar o calor.", { outlet: "Jornal do Sertão" }],
    ],
  },
  "videomaker": {
    name: "Davi Lacerda", headline: "Vídeos reais para marcas, pessoas e ideias", role: "editor", city: "Goiânia/GO",
    bio: "Dirijo, capto e edito vídeos com linguagem cinematográfica para marcas, eventos e projetos autorais.",
    stats: [["7", "anos filmando"], ["190", "vídeos"]],
    works: [
      ["Rota Costeira", "v", "Filme de marca", "Pousada Rota Costeira", "2025", 25, "Filme de 2 minutos gravado em três dias de viagem.", { featured: true }],
      ["Ondas", "v", "Esporte", "Escola de Surf Mar Aberto", "2025", 190, "Vídeo de 1 minuto para campanha de matrículas."],
      ["Vozes da cidade", "v", "Minidoc", "Projeto autoral", "2024", 15, "Minidocumentário de 6 minutos com moradores do centro."],
    ],
    services: [["Captação", "Equipe enxuta, câmera cinema e drone."], ["Direção", "Conceito, roteiro e condução no set."], ["Edição", "Montagem, cor e som."], ["Conteúdo", "Versões para redes sociais e eventos."]],
  },
  "producao-audiovisual": {
    team: [["Lia Campos", "Direção"], ["Rui Teles", "Fotografia"], ["Ana Brito", "Produção"], ["Caio Reis", "Montagem"]],
    name: "Estúdio Quadro", headline: "Produção audiovisual do conceito à entrega", role: "produtor", city: "Rio de Janeiro/RJ",
    bio: "Somos uma produtora com equipe multidisciplinar e estrutura para filmes, séries e conteúdo institucional em todo o Brasil.",
    stats: [["15", "anos de produção"], ["40", "profissionais na rede"]],
    pillars: [["Pré-produção", "Roteiro, orçamento e cronograma."], ["Set", "Equipe técnica e elenco."], ["Pós", "Edição, cor, som e entrega."]],
    works: [
      ["Casa da Memória", "v", "Documentário", "Instituto Casa da Memória", "2025", 30, "Documentário de 26 minutos.", { role: "Produção executiva", contribution: "Produção, direção de fotografia e pós" , featured: true }],
      ["Campo Vivo", "v", "Série", "Canal Terra Boa", "2024", 95, "Série em três episódios.", { role: "Produção", contribution: "Produção e finalização" }],
      ["Mover", "v", "Campanha", "Academia Movimento", "2024", 10, "Filme de 60 segundos.", { role: "Produção", contribution: "Produção completa" }],
    ],
  },
  "designer-grafico": {
    name: "Estúdio Gráfico Tinta", headline: "Design estratégico para marcas reais", role: "designer", city: "Porto Alegre/RS",
    bio: "Criamos identidades visuais, embalagens e sistemas de comunicação para marcas pequenas e médias.",
    stats: [["10", "anos"], ["90", "marcas criadas"]],
    pillars: [["Briefing", "Alinhamento de objetivos."], ["Pesquisa", "Referências e diagnóstico."], ["Criação", "Conceito, linguagem e desdobramentos."], ["Entrega", "Arquivos, manual e acompanhamento."]],
    works: [
      ["Mira", "i", "Identidade visual", "Mira Óptica", "2025", 225, "Marca e papelaria.", { featured: true }],
      ["Café Aurora", "i", "Embalagem", "Café Aurora", "2025", 25, "Linha de cinco embalagens."],
      ["Festival Norte", "i", "Direção de arte", "Festival Norte", "2024", 5, "Cartaz, sinalização e peças digitais."],
    ],
  },
  "motion-design": {
    name: "MotionLab", headline: "Motion design que dá vida às ideias", role: "motion", city: "São Paulo/SP",
    bio: "Animação, design em movimento e conteúdo visual para marcas, campanhas e produtos digitais.",
    stats: [["6", "anos"], ["120", "animações"]],
    works: [
      ["Motion reel", "v", "Reel", "Seleção do estúdio", "2026", 280, "Seleção de animações de 2 minutos e 32 segundos.", { featured: true }],
      ["Identidade em movimento", "v", "Marca", "Banco Alvo", "2025", 250, "Logo animado e transições de 30 segundos."],
      ["App Launch", "v", "Produto", "App Trilha", "2025", 50, "Filme 3D de lançamento."],
      ["Campanha Verão", "v", "Comercial", "Sorveteria Polar", "2024", 190, "Animação de 15 segundos."],
    ],
    services: [["Animação 2D/3D", "Do storyboard à entrega."], ["Vinhetas", "Aberturas e encerramentos."], ["Conteúdo digital", "Peças animadas para redes."], ["Direção de arte", "Estilo e storyboard."]],
  },
  "fotografia": {
    name: "Marina Couto", headline: "Fotografia para pessoas, marcas e histórias", role: "fotografo", city: "Curitiba/PR",
    bio: "Retratos, ensaios editoriais e cobertura de projetos culturais, com luz natural e direção cuidadosa.",
    stats: [["9", "anos fotografando"], ["300", "ensaios"]],
    pillars: [["Retrato", "Ensaios pessoais e corporativos."], ["Editorial", "Moda e revistas."], ["Documental", "Projetos culturais e territórios."]],
    works: [
      ["Corpo e Cidade", "i", "Ensaio autoral", "Projeto autoral", "2025", 15, "Série de 20 retratos no centro histórico.", { featured: true }],
      ["Moda Verão 25", "i", "Editorial", "Revista Ponto", "2025", 340, "Editorial de 12 páginas."],
      ["Territórios", "i", "Documental", "Fundação Cultural Sul", "2024", 30, "Arquitetura e memória de bairros operários."],
    ],
  },
  "jornalismo": {
    name: "Daniel Rios", headline: "Reportagens, análises e histórias que importam", role: "jornalista", city: "Brasília/DF",
    bio: "Jornalista especializado em política, direitos humanos e sociedade.",
    stats: [["12", "anos"], ["500", "matérias"]],
    works: [
      ["Como as periferias estão reinventando a cidade", "a", "Cidades", "Revista Agenda Pública", "2025", 30, "Série especial sobre mobilidade, cultura e inovação nas bordas urbanas.", { outlet: "Revista Agenda Pública", featured: true }],
      ["A nova geração de líderes comunitários", "a", "Sociedade", "Jornal Planalto", "2024", 210, "Perfis de lideranças jovens.", { outlet: "Jornal Planalto" }],
      ["Seca preocupa comunidades do Semiárido", "a", "Clima", "Portal Brasil Central", "2024", 45, "Reportagem com dados de chuva de 20 anos.", { outlet: "Portal Brasil Central" }],
      ["Educação pública e o desafio da permanência", "a", "Educação", "Revista Agenda Pública", "2023", 260, "Evasão escolar no ensino médio.", { outlet: "Revista Agenda Pública" }],
    ],
  },
  "social-media": {
    name: "SocialBüro", headline: "Estratégia e conteúdo para marcas que conversam", role: "social", city: "São Paulo/SP",
    bio: "Planejamento, criação e gestão de redes sociais com foco em resultado.",
    stats: [["+320%", "engajamento médio"], ["+180%", "alcance orgânico"], ["+12 mi", "impressões"]],
    works: [
      ["Beleza Viva", "i", "Lançamento", "Cosméticos Viva", "2025", 340, "Lançamento em vídeos curtos e carrossel.", { featured: true }],
      ["Café do Pátio", "i", "Conteúdo contínuo", "Café do Pátio", "2025", 30, "Gestão mensal de conteúdo."],
      ["Move Mais", "i", "Campanha", "Rede Move Mais", "2024", 200, "Campanha multiplataforma de matrículas."],
    ],
  },
  "assessoria-imprensa": {
    name: "Pauta Press", headline: "Relacionamento com a imprensa para marcas, projetos e causas", role: "assessor", city: "São Paulo/SP",
    bio: "Estratégia, produção de conteúdo e visibilidade na mídia para cultura, educação e terceiro setor.",
    stats: [["14", "anos"], ["1.200", "inserções"]],
    clients: ["Instituto Aurora Sul", "Coletivo Mata Viva", "Fundação Semear", "Editora Margem"],
    works: [
      ["Projeto social amplia acesso à cultura em 12 cidades", "a", "Cultura", "Jornal Econômico (exemplo)", "2024", 210, "Clipping para Fundação Semear.", { outlet: "Jornal Econômico (exemplo)", featured: true }],
      ["Iniciativa de educação ambiental ganha destaque", "a", "Educação", "Portal EdTech", "2024", 140, "Clipping para Coletivo Mata Viva.", { outlet: "Portal EdTech" }],
      ["Programa de inclusão profissional beneficia jovens", "a", "Trabalho", "TV Cidade", "2023", 30, "Reportagem em TV para Instituto Aurora Sul.", { outlet: "TV Cidade" }],
    ],
  },
  "locucao-audio": {
    name: "Lucas Menezes", headline: "Locução profissional para suas ideias", role: "locutor", city: "Belo Horizonte/MG",
    bio: "Voz para comerciais, vídeos institucionais, e-learning, podcasts e documentários. Home studio tratado.",
    stats: [["10", "anos de voz"], ["2.000", "gravações"]],
    works: [
      ["Comercial — Institucional", "u", "0:30", "Demo", "2025", 140, "Tom caloroso e confiante."],
      ["E-learning — Didática", "u", "0:45", "Demo", "2025", 150, "Ritmo claro para cursos."],
      ["Podcast — Vinheta", "u", "0:20", "Demo", "2025", 160, "Abertura energética."],
      ["Narração — Documental", "u", "1:00", "Demo", "2024", 120, "Narração sóbria."],
      ["Curso Online", "v", "Voz e direção", "Escola Digital Saber", "2024", 100, "48 aulas gravadas.", { featured: true }],
      ["Campanha Nacional", "v", "Comercial", "Rede Farma Mais", "2024", 40, "Locução para TV e rádio."],
    ],
  },
  "direcao-fotografia": {
    name: "Luca Mendes", headline: "Luz, movimento e narrativa", role: "editor", city: "São Paulo/SP",
    bio: "Diretor de fotografia para cinema, séries, publicidade e conteúdo digital.",
    stats: [["13", "anos de set"], ["35", "filmes"]],
    works: [
      ["Terra Seca", "v", "Curta-metragem", "Câmera ARRI · lentes Cooke", "2023", 35, "Drama rural filmado em luz natural.", { featured: true }],
      ["O Rio Dentro", "v", "Documentário", "Câmera RED · lentes Zeiss", "2022", 25, "Documentário de longa-metragem."],
      ["Vértice", "v", "Série", "Câmera Sony Venice", "2021", 220, "Série policial noturna."],
      ["Linha de Chegada", "v", "Longa", "Câmera ARRI Alexa", "2020", 45, "Drama esportivo."],
      ["Beco 17", "v", "Série", "Câmera RED Helium", "2019", 0, "Suspense urbano."],
      ["Cidade Líquida", "v", "Videoclipe", "Câmera Blackmagic", "2019", 200, "Clipe com neon e chuva."],
    ],
  },
  "documentarista": {
    name: "Marina Prado", headline: "Pessoas reais, histórias essenciais", role: "produtor", city: "Manaus/AM",
    bio: "Documentários sobre comunidades, território, cultura e direitos.",
    stats: [["11", "anos"], ["6", "filmes"]],
    works: [
      ["Comunidade do Rio", "v", "Documentário", "52 min", "2023", 30, "A força de uma comunidade ribeirinha na Amazônia.", { featured: true }],
      ["Mulheres da Terra", "v", "Documentário", "48 min", "2021", 25, "Trabalhadoras rurais, organização e resistência."],
      ["Infâncias do Morro", "v", "Documentário", "40 min", "2019", 15, "O cotidiano de crianças em uma periferia."],
    ],
    experience: [["2023", "Mostra Internacional de Documentários", "Seleção oficial"], ["2022", "Festival Verdade em Tela (exemplo)", "Exibição"], ["2021", "Festival Baía de Cinema (exemplo)", "Exibição"]],
  },
  "reporter-tv": {
    name: "Rafael Torres", headline: "Informação em campo, com profundidade", role: "jornalista", city: "Rio de Janeiro/RJ",
    bio: "Repórter de TV com reportagens especiais, coberturas ao vivo e grandes histórias.",
    stats: [["9", "anos de TV"], ["700", "reportagens"]],
    works: [
      ["Enchentes no Norte: os impactos nas cidades", "v", "Reportagem especial", "TV Atlântico", "2024", 200, "Reportagem especial de 12 minutos.", { featured: true }],
      ["Como as mudanças climáticas afetam a vida nas cidades", "a", "Clima", "TV Atlântico", "2024", 190, "Série em três partes.", { outlet: "TV Atlântico" }],
      ["A retomada do turismo na serra", "a", "Economia", "TV Atlântico", "2024", 30, "Reportagem do jornal da noite.", { outlet: "TV Atlântico" }],
      ["Inteligência artificial na educação", "a", "Tecnologia", "Programa Conexão", "2024", 260, "Quadro especial.", { outlet: "Programa Conexão" }],
    ],
  },
  "direcao-arte": {
    name: "Bia Nascimento", headline: "Direção de arte que dá sentido às ideias", role: "designer", city: "São Paulo/SP",
    bio: "Conceito, imagem, cenário, objeto e experiência para campanhas e projetos culturais.",
    stats: [["10", "anos"], ["70", "campanhas"]],
    works: [
      ["Campanha Vozes", "i", "Publicidade", "Rádio Liberdade", "2024", 280, "Direção de arte, conceito e cenografia.", { featured: true }],
      ["Lançamento Linha X", "i", "Produto", "Tênis Passo", "2023", 210, "Direção de arte e fotografia."],
      ["Beleza Real", "i", "Campanha", "Cosméticos Aura", "2023", 345, "Direção de arte e styling."],
      ["Festival Pulsar", "i", "Evento", "Festival Pulsar", "2022", 300, "Cenografia e identidade."],
      ["Identidade Somos", "i", "Marca", "Coletivo Somos", "2022", 30, "Conceito visual."],
      ["Cidade em Cor", "i", "Projeto cultural", "Prefeitura (exemplo)", "2021", 200, "Intervenções urbanas."],
    ],
  },
  "redacao-publicitaria": {
    name: "Bruno Lessa", headline: "Palavras que conectam marcas e pessoas", role: "jornalista", city: "São Paulo/SP",
    bio: "Conceito, campanha, roteiro, manifesto, texto de marca e conteúdo omnichannel.",
    stats: [["12", "anos de redação"], ["8", "prêmios"]],
    works: [
      ["“Cuidar é transformar”", "s", "Manifesto", "Cosméticos Raiz", "2025", 140, "Cuidar de você também muda o mundo. Brief: reposicionar a marca no território de impacto positivo.", { featured: true }],
      ["“Feito para o seu amanhã”", "s", "Campanha", "Banco Horizonte", "2024", 30, "Hoje, a gente investe no que vem depois. Brief: o papel do banco na jornada de longo prazo."],
      ["“Movimento é liberdade”", "s", "Campanha", "Tênis Passo", "2024", 0, "Mais do que performance, é expressão. Brief: campanha esportiva com foco em inclusão."],
    ],
  },
  "podcast-producao-sonora": {
    name: "Carla Farias", headline: "Histórias que soam longe", role: "locutor", city: "Rio de Janeiro/RJ",
    bio: "Criação, produção, edição e design de som para podcasts, séries e narrativas em áudio.",
    stats: [["7", "anos"], ["300", "episódios"]],
    works: [
      ["Trailer de produção", "u", "1:32", "Demo", "2025", 5, "Trechos das séries produzidas.", { featured: true }],
      ["Vozes da Cidade", "u", "8 episódios", "Rádio Cidade (exemplo)", "2024", 15, "Podcast original sobre moradores do centro."],
      ["Ciência por Aí", "u", "12 episódios", "Universidade (exemplo)", "2023", 250, "Parceria de divulgação científica."],
      ["Mulheres em Pauta", "v", "Série", "Plataforma Ouça", "2022", 320, "10 episódios com videocast."],
    ],
    services: [["Criação e roteirização", "Formato, pauta e roteiro."], ["Gravação e captação", "Estúdio e externas."], ["Edição e mixagem", "Limpeza, trilha e masterização."]],
  },
  "cobertura-eventos": {
    name: "Pedro Avelar", headline: "Eventos ao vivo, do planejamento à entrega", role: "produtor", city: "São Paulo/SP",
    bio: "Cobertura audiovisual e fotográfica de eventos corporativos, culturais, festivais e lançamentos.",
    stats: [["8", "anos"], ["250", "eventos"]],
    works: [
      ["Highlights — Festival Aurora 2024", "v", "Festival", "Festival Aurora", "2024", 285, "Resumo de 2 minutos e 36 segundos.", { featured: true }],
      ["ExpoTech BR", "v", "Cobertura completa", "ExpoTech (exemplo)", "2024", 220, "Vídeo e foto durante três dias."],
      ["Encontro de Lideranças", "v", "Corporativo", "Instituto Liderar", "2023", 250, "Vídeo e foto do evento."],
    ],
    services: [["Vídeo multicâmera", "Até 6 câmeras com corte ao vivo."], ["Fotografia editorial", "Entrega no mesmo dia."], ["Transmissão ao vivo", "Streaming para plataformas."], ["Clipes e highlights", "Cortes para redes."]],
  },
  "comunicacao-corporativa": {
    name: "Camila Duarte", headline: "Comunicação que engaja pessoas e constrói reputação", role: "assessor", city: "Belo Horizonte/MG",
    bio: "Estratégia, planejamento e execução de comunicação interna e institucional.",
    stats: [["11", "anos"], ["30", "empresas"]],
    works: [
      ["Cultura em Movimento", "i", "Comunicação interna", "Energia Solaris", "2024", 200, "Engajamento, clima e reforço da cultura em campanha multicanal.", { featured: true }],
      ["Relatório de Sustentabilidade", "i", "Comunicação institucional", "Grupo Industrial Delta", "2023", 120, "Conteúdo, narrativa e divulgação para stakeholders."],
    ],
    services: [["Diagnóstico e estratégia", "Pesquisa e plano de comunicação."], ["Campanhas internas", "Conceito, peças e canais."], ["Conteúdo multicanal", "Textos, vídeos e eventos."], ["Mensuração", "Indicadores e relatórios."]],
  },
  "estrategia-conteudo": {
    name: "Thiago Brito", headline: "Conteúdo com estratégia, objetivo e resultado", role: "social", city: "Porto Alegre/RS",
    bio: "Planejamento, produção e gestão de conteúdo para marcas, produtos e instituições.",
    stats: [["9", "anos"], ["45", "projetos"]],
    pillars: [["Diagnóstico", "Público, objetivos e contexto."], ["Estratégia", "Temas, formatos e canais."], ["Produção", "Conteúdo com consistência."], ["Distribuição", "Execução e amplificação."], ["Mensuração", "Resultados e próximos passos."]],
    works: [
      ["Turismo o Ano Todo", "i", "Turismo", "Secretaria de Turismo (exemplo)", "2024", 30, "Estratégia de conteúdo editorial e campanha."],
      ["Educação Conecta", "i", "Educação", "EdTech Conecta", "2025", 210, "Posicionamento, SEO, blog e redes."],
      ["Energia em Foco", "i", "Energia", "Energia Limpa Sul", "2023", 150, "Conteúdo, storytelling e campanha de awareness.", { featured: true }],
    ],
  },
  "estudio-criativo": {
    team: [["Ana Reis", "Direção criativa"], ["Lucas Melo", "Direção de arte"], ["Giulia Ramos", "Produção"], ["Rafa Souza", "Vídeo e edição"]],
    name: "Estúdio Lume", headline: "Ideias, imagens e narrativas para marcas que querem ir mais longe", role: "designer", city: "São Paulo/SP",
    bio: "Direção criativa, identidade, vídeo e campanhas integradas.",
    stats: [["5", "anos"], ["4", "sócios"]],
    works: [
      ["Identidade de marca", "i", "Marca", "Startup Nuvem", "2024", 235, "Sistema visual completo.", { featured: true }],
      ["Vídeo institucional", "v", "Institucional", "Hospital Vida", "2024", 220, "Filme de 3 minutos."],
      ["Campanha integrada", "i", "Publicidade", "Rede Mercado Bom", "2023", 0, "Campanha em TV, rua e digital."],
    ],
  },
  "colorista": {
    name: "Colorista Vera Lins", headline: "Direção de cor para narrativas em movimento", role: "editor", city: "São Paulo/SP",
    bio: "Color grading para cinema, séries, publicidade e videoclipes.",
    stats: [["10", "anos de cor"], ["200", "projetos"]],
    works: [
      ["Sem Rastro", "v", "Curta-metragem", "ARRI Alexa · Rec.709", "2025", 30, "Drama noturno com cor fria e pele preservada.", { featured: true, coverOriginal: demoArt(30, "Original", 8) }],
      ["Vera", "v", "Série", "Red Komodo · HDR", "2024", 330, "Suspense em quatro episódios."],
      ["Linha d'Água", "v", "Documentário", "Sony FX6 · HDR", "2024", 35, "Documentário ambiental."],
    ],
  },
  "efeitos-visuais": {
    name: "VFX Lab", headline: "Efeitos visuais que expandem histórias", role: "motion", city: "São Paulo/SP",
    bio: "Composição, CG, matte painting e integração realista para cinema, TV, publicidade e streaming.",
    stats: [["7", "anos"], ["400", "shots"]],
    works: [
      ["Órbita Zero", "v", "Série", "Composição · CG", "2025", 245, "Nave e cenário digital integrados.", { featured: true, gallery: [demoArt(245, "Plate", 20), demoArt(0, "Máscaras", 0), demoArt(260, "Final")] }],
      ["Colapso", "v", "Longa", "Simulação · Partículas", "2024", 15, "Destruição de prédio em sequência."],
      ["Hélio", "v", "Clipe", "Troca de céu · CG", "2024", 210, "Céu digital e personagem em CG."],
    ],
  },
  "roteiro-audiovisual": {
    name: "Roteira Ana Lobo", headline: "Histórias estruturadas para a tela", role: "jornalista", city: "Rio de Janeiro/RJ",
    bio: "Roteiro para cinema, séries, TV, web e formatos de não ficção.",
    stats: [["8", "anos"], ["12", "roteiros produzidos"]],
    works: [
      ["Sem Sinal", "s", "Drama · Série", "Série (6 ep.)", "2025", 30, "INT. CASA DA MÃE — NOITE. A sala está quase vazia. Caixas no canto. MIGUEL: A gente prometeu que não ia voltar mais.", { featured: true }],
      ["Margem", "s", "Documentário", "Longa (90 min)", "2024", 200, "Uma repórter investiga o fim de um rio em uma comunidade ribeirinha."],
      ["O Último Trem", "s", "Drama", "Telefilme (70 min)", "2023", 15, "Em uma viagem noturna, estranhos compartilham histórias que não contaram."],
    ],
  },
  "ilustracao-editorial": {
    name: "Traço Editorial", headline: "Ilustrações que interpretam o mundo", role: "designer", city: "Recife/PE",
    bio: "Ilustração editorial para revistas, jornais, livros e projetos de comunicação.",
    stats: [["9", "anos"], ["600", "ilustrações"]],
    works: [
      ["Cidades e pessoas", "i", "Ensaio autoral", "Revista Ponto", "2025", 20, "Ilustração de página dupla.", { featured: true }],
      ["Clima em pauta", "i", "Reportagem", "Jornal do Dia (exemplo)", "2024", 210, "Abertura de caderno especial."],
      ["Vozes da escola", "i", "Educação", "Caderno especial", "2024", 45, "Série de três ilustrações."],
      ["Leitura", "a", "Capa", "Revista Leitura (exemplo)", "2024", 200, "Capa da edição especial.", { outlet: "Revista Leitura (exemplo)" }],
      ["Horizonte", "a", "Capa", "Revista Horizonte (exemplo)", "2023", 15, "Capa e miolo ilustrados.", { outlet: "Revista Horizonte (exemplo)" }],
    ],
  },
  "fotojornalismo": {
    mono: true,
    name: "Foto Repórter Igor Sá", headline: "Fotojornalismo para ver, entender e lembrar", role: "fotografo", city: "Belém/PA",
    bio: "Reportagens visuais sobre pessoas, territórios e direitos.",
    stats: [["12", "anos de campo"], ["40", "reportagens"]],
    works: [
      ["O rio que resiste", "a", "Amazônia", "Diário Norte (exemplo)", "2024", 0, "A vida ribeirinha diante do avanço do desmatamento.", { outlet: "Diário Norte (exemplo)", featured: true }],
      ["Juventude em movimento", "a", "Cidades", "Revista Lente", "2024", 0, "Coletivos de periferia que transformam a cidade.", { outlet: "Revista Lente" }],
      ["Sementes do semiárido", "a", "Campo", "Portal País (exemplo)", "2024", 0, "Agricultores mantêm práticas sustentáveis.", { outlet: "Portal País (exemplo)" }],
    ],
  },
  "design-informacao": {
    name: "InfoDesign", headline: "Dados que informam, explicam e engajam", role: "designer", city: "Brasília/DF",
    bio: "Visualização, infografia e narrativas com dados para mídia, instituições e campanhas.",
    stats: [["8", "anos"], ["150", "visualizações"]],
    pillars: [["Coleta", "Fontes e tratamento."], ["Análise", "Leitura e cruzamentos."], ["Visualização", "Gráficos, mapas e infográficos."], ["Entrega", "Peças para web, redes e impressos."]],
    works: [
      ["Acesso à cultura no Brasil", "i", "Infografia interativa", "Observatório Cultura", "2025", 250, "Equipamentos culturais por região.", { featured: true }],
      ["Mobilidade urbana", "i", "Gráfico", "Instituto Cidades", "2024", 200, "Evolução do transporte público nas capitais."],
      ["Quem cuida do cuidado?", "i", "Dados", "Revista Dados (exemplo)", "2024", 230, "Perfil de cuidadores no Brasil."],
    ],
  },
  "apresentacao-mediacao": {
    name: "Mediação Joana Reis", headline: "Apresentação, mediação e condução de conversas", role: "locutor", city: "Salvador/BA",
    bio: "Mediação de debates, eventos, painéis e programas ao vivo com escuta ativa e clareza.",
    stats: [["10", "anos de palco"], ["180", "eventos"]],
    experience: [["18 MAR", "Construção de narrativas públicas", "Mesa · São Paulo"], ["09 ABR", "Comunicação e democracia", "Debate · Brasília"], ["24 ABR", "Cultura, mídia e territórios", "Painel · Salvador"]],
    works: [
      ["Trechos de mediações", "v", "Highlights", "Seleção", "2025", 340, "Três minutos de trechos.", { featured: true }],
      ["Fórum de Cidades", "v", "Mediação", "Fórum de Cidades", "2024", 25, "Painel com prefeitos e especialistas."],
      ["Mostra de Cinema", "v", "Apresentação", "Mostra Bahia (exemplo)", "2024", 300, "Cerimônia de abertura."],
      ["Diálogos da Educação", "v", "Mediação", "Fundação Aprender", "2023", 30, "Ciclo de debates."],
    ],
  },
  "comunicacao-publica": {
    name: "ComPública", headline: "Comunicação pública que informa, orienta e aproxima", role: "assessor", city: "Fortaleza/CE",
    bio: "Campanhas, serviços e materiais de interesse da população.",
    stats: [["+1,2 mi", "pessoas alcançadas"], ["48", "municípios"], ["92%", "avaliação positiva"]],
    services: [["Cartilhas", "Linguagem simples e ilustrada"], ["Vídeos", "Com Libras e legendas"], ["Áudios", "Informação em formato podcast"], ["Materiais em braile", "Versões impressas inclusivas"]],
    works: [
      ["Vacinação em dia", "i", "Saúde", "Secretaria de Saúde (exemplo)", "2025", 190, "Campanha de vacinação e prevenção.", { featured: true }],
      ["Mobilidade mais fácil", "i", "Transporte", "Agência de Trânsito (exemplo)", "2024", 215, "Informação e cidadania sobre transporte."],
      ["Cidade mais verde", "i", "Meio ambiente", "Secretaria do Verde (exemplo)", "2024", 110, "Engajamento para o cuidado das áreas verdes."],
    ],
  },
  "ux-writing": {
    name: "UXTexto", headline: "Microtextos que orientam, engajam e simplificam", role: "jornalista", city: "São Paulo/SP",
    bio: "UX writing, arquitetura de conteúdo e linguagem para produtos e serviços digitais.",
    stats: [["6", "anos"], ["20", "produtos"]],
    pillars: [["Diagnóstico", "Leitura do conteúdo atual."], ["Estratégia", "Tom de voz e arquitetura."], ["Escrita e testes", "Microtextos testados com usuários."], ["Entrega", "Guia e biblioteca de textos."]],
    works: [
      ["App de serviços públicos", "i", "Produto digital", "App Cidadão (exemplo)", "2025", 150, "Revisão de microtextos, fluxos e mensagens de erro.", { featured: true, contribution: "Antes: “Enviar solicitação”. Depois: “Pedir atendimento”.", deliverables: ["Guia de voz", "Biblioteca de microtextos", "Testes com usuários"] }],
      ["Checkout sem atrito", "i", "E-commerce", "Loja Fácil (exemplo)", "2024", 30, "Textos de pagamento e confirmação.", { contribution: "Redução de dúvidas no suporte", deliverables: ["Fluxo revisado", "Mensagens de erro"] }],
    ],
  },
  "producao-criadores": {
    name: "CriadorPro", headline: "Produção audiovisual para criadores de conteúdo", role: "editor", city: "São Paulo/SP",
    bio: "Planejamento, gravação, edição e finalização de vídeos para redes sociais e YouTube.",
    stats: [["5", "anos"], ["1.500", "vídeos"]],
    services: [["Edição e corte", "Vídeos e shorts"], ["Capas", "Thumbnails e artes"], ["Vinhetas", "Abertura e identidade"], ["Pacotes de clipes", "Cortes para redes"]],
    works: [
      ["Dicas de produtividade", "v", "Short", "Canal Foco", "2025", 25, "Corte vertical de 45 segundos.", { aspect: "9:16" }],
      ["Bastidores do estúdio", "v", "Reel", "Canal Foco", "2025", 300, "Bastidores de gravação.", { aspect: "9:16" }],
      ["Como planejo meus vídeos", "v", "Episódio", "Canal Criar Melhor", "2025", 200, "Episódio de 14 minutos.", { featured: true }],
      ["Equipamentos que uso", "v", "Episódio", "Canal Criar Melhor", "2024", 220, "Episódio de 18 minutos."],
    ],
  },
  "vitrine-multidisciplinar": {
    name: "Nina Barros", headline: "Jornalismo, vídeo e tecnologia", role: "produtor", city: "Manaus/AM",
    bio: "Projetos que investigam, contam histórias e exploram novas linguagens, do campo à tela.",
    stats: [["3", "áreas"], ["40", "projetos"]],
    works: [
      ["Amazônia em transição", "v", "Audiovisual", "Documentário", "2025", 150, "Vídeo documental.", { featured: true }],
      ["A força das periferias", "a", "Reportagem", "Revista Margem", "2024", 30, "Reportagem especial.", { outlet: "Revista Margem" }],
      ["Dados da educação", "i", "Tecnologia", "Painel interativo", "2024", 220, "Visualização de dados."],
      ["IA no dia a dia", "i", "Tecnologia", "Explicativo", "2025", 250, "Explicativo interativo."],
      ["Mobilidade nas cidades", "i", "Reportagem", "Especial", "2023", 200, "Texto e mapa."],
    ],
  },
  "case-em-profundidade": {
    name: "FolioCase · Teresa Lima", headline: "Cobertura especial: a vida na seca", role: "jornalista", city: "Petrolina/PE",
    bio: "Como transformei uma pauta regional em uma série multimídia com impacto nacional.",
    stats: [["5", "capítulos"], ["1,2 mi", "leituras"]],
    pillars: [["Problema", "A seca afetava milhares de famílias, mas a cobertura era fragmentada."], ["Meu papel", "Apuração, produção de textos e coordenação do vídeo."], ["Resultado", "Série premiada e debate público sobre o semiárido."]],
    works: [
      ["A vida na seca", "i", "Série multimídia", "Portal Semiárido", "2024", 35, "Do planejamento à publicação em etapas, com protótipos e fontes locais.", { featured: true, contribution: "Apuração, roteiro e coordenação", deliverables: ["5 capítulos", "Vídeos", "Mapa interativo"] }],
      ["Wireframe da série", "i", "Processo", "Portal Semiárido", "2024", 210, "Estrutura de navegação dos capítulos.", { contribution: "Arquitetura do conteúdo", deliverables: ["Wireframe", "Roteiro de navegação"] }],
    ],
  },
  "servicos-orcamento": {
    faq: [["Como funciona o orçamento?", "Você conta o projeto e eu envio uma proposta em até 2 dias úteis."], ["Quais são os prazos de entrega?", "Depende do formato: vídeos curtos em 1 semana, séries em 3 a 6 semanas."], ["Você trabalha com empresas e veículos?", "Sim, atendo marcas, ONGs e redações em todo o Brasil."]],
    name: "FreelaCom · Igor Matos", headline: "Conteúdo estratégico para marcas, projetos e veículos", role: "editor", city: "Fortaleza/CE",
    bio: "Jornalismo, vídeo e comunicação digital com foco em resultado.",
    stats: [["8", "anos"], ["120", "clientes"]],
    works: [
      ["Territórios em foco", "v", "Série", "ONG Terra (exemplo)", "2024", 30, "Série de vídeos.", { featured: true }],
      ["Campanha Recicla+", "i", "Campanha", "Marca Recicla+", "2024", 120, "Conteúdo digital."],
      ["Mobilidade ativa", "a", "Reportagem", "Portal Cidades", "2023", 200, "Reportagem especial.", { outlet: "Portal Cidades" }],
    ],
    services: [["Produção de conteúdo", "Reportagens, textos institucionais e narrativas para web.", "a partir de R$ 600"], ["Audiovisual", "Roteiro, gravação e edição de vídeos.", "a partir de R$ 1.200"], ["Estratégia digital", "Planejamento de conteúdo e distribuição.", "sob consulta"]],
  },
  "campanhas-resultados": {
    name: "ImpactoCom", headline: "Consumo consciente, impacto real", role: "social", city: "Belém/PA",
    bio: "Campanhas integradas que geram resultado para marcas e causas.",
    stats: [["+1,2 mi", "pessoas alcançadas"], ["+48%", "engajamento"], ["+3,6 mil", "cadastros"]],
    works: [
      ["Consumo consciente", "v", "Filme principal", "Prefeitura de Belém (exemplo)", "2024", 25, "Campanha integrada para estimular hábitos de consumo sustentáveis.", { featured: true, contribution: "Planejamento, roteiro e acompanhamento de resultados", deliverables: ["Filme 1'30\"", "5 conteúdos para redes", "Cartazes"] }],
      ["Redes sociais", "i", "Série de conteúdos", "Prefeitura de Belém (exemplo)", "2024", 30, "Série de cinco conteúdos.", { contribution: "Criação e gestão", deliverables: ["Carrossel", "Reels"] }],
      ["Mídia externa", "i", "Cartazes e painéis", "Prefeitura de Belém (exemplo)", "2024", 200, "Painéis em pontos de ônibus.", { contribution: "Direção de arte", deliverables: ["12 painéis"] }],
    ],
  },
  "projetos-digitais": {
    name: "Estúdio Digital Pixel", headline: "Projetos digitais que informam, engajam e resolvem", role: "designer", city: "Recife/PE",
    bio: "Desenvolvimento de sites, hotsites e experiências interativas com foco em conteúdo e usabilidade.",
    stats: [["7", "anos"], ["60", "sites"]],
    works: [
      ["Mapa da Mobilidade", "i", "Site interativo", "Instituto Cidades", "2025", 210, "Plataforma com dados, mapas e histórias.", { featured: true, software: ["React", "Dados", "Mapas"], repositoryUrl: "https://exemplo.dev/mapa" }],
      ["Memórias do Bairro", "i", "Site", "Associação de Moradores", "2024", 30, "Acervo de fotos, relatos e linha do tempo.", { software: ["Next.js", "CMS"] }],
    ],
  },
  "projetos-educacionais": {
    name: "AprendeMais", headline: "Educação e comunicação para transformar realidades", role: "produtor", city: "Porto Alegre/RS",
    bio: "Cursos, oficinas e materiais educativos com linguagem prática e inclusiva.",
    stats: [["6", "anos"], ["4.000", "estudantes"]],
    services: [["Guia de comunicação na escola", "PDF · 2,4 MB"], ["Roteiro de oficina (editável)", "DOCX · 1,1 MB"], ["Cartilha de referência", "PDF · 4,5 MB"]],
    pillars: [["Educadores e escolas", "Práticas de comunicação no ensino."], ["Jovens e coletivos", "Protagonismo juvenil."], ["Organizações sociais", "Formação de baixo custo e alto impacto."]],
    works: [
      ["Comunicação comunitária", "v", "Curso online", "4 módulos", "2025", 30, "Curso com aulas em vídeo e atividades.", { featured: true }],
      ["Narrativas digitais na educação", "v", "Curso híbrido", "3 módulos", "2024", 210, "Formação para professores."],
      ["Projetos de impacto local", "v", "Curso online", "5 módulos", "2024", 120, "Do diagnóstico ao projeto."],
    ],
  },
  "equipe-projetos": {
    team: [["Ana Silva", "Jornalista"], ["Rafa Costa", "Videomaker"], ["Carla Neves", "Produtora"], ["Diego Melo", "Diretor criativo"], ["Luísa Barros", "Designer"]],
    name: "Coletivo Vermelho", headline: "Jornalismo, cultura e projetos colaborativos", role: "produtor", city: "São Paulo/SP",
    bio: "Um coletivo de comunicadores, designers e produtores que cria histórias, campanhas e experiências com impacto social.",
    stats: [["6", "integrantes"], ["30", "projetos"]],
    works: [
      ["Vozes do Rio", "v", "Série documental", "Equipe: Ana (direção), Rafa (câmera), Carla (edição)", "2024", 200, "Série documental em quatro episódios.", { featured: true, contribution: "Ana Silva (direção) · Rafa Costa (câmera) · Carla Neves (edição)" }],
      ["Arte na Quebrada", "i", "Campanha", "Equipe: Diego (direção), Luísa (conteúdo)", "2024", 300, "Campanha cultural.", { contribution: "Diego Melo (direção de arte) · Luísa Barros (conteúdo)" }],
      ["Feira Viva", "v", "Projeto transmídia", "Equipe: Carla (produção), Rafael (vídeo)", "2023", 30, "Cobertura e documentação.", { contribution: "Carla Neves (produção) · Rafael Dias (vídeo)" }],
    ],
    services: [["Produção de conteúdo", "Reportagens, textos e roteiros."], ["Vídeo e documentário", "Da pesquisa à finalização."], ["Campanhas", "Conceito, peças e distribuição."]],
  },
};

// Fictional examples only; never injected into a client profile.
const ROLE_EXAMPLES: Record<RoleId,string>={editor:"editor-pro",produtor:"producao-audiovisual",designer:"designer-grafico",motion:"motion-design",fotografo:"fotografia",jornalista:"jornalismo",social:"social-media",assessor:"assessoria-imprensa",locutor:"locucao-audio"};
for (const design of MOTION_DESIGNS) {
  const source=SPECS[ROLE_EXAMPLES[design.role]];
  SPECS[design.id]={...source,name:`Estúdio ${design.name}`,headline:`${design.name}: ${source.headline}`,services:source.services??[["Criação e produção","Projetos de comunicação sob medida."]],experience:source.experience??[["JAN-2021 — ATUAL","Profissional independente","Estúdio (exemplo)"]],education:source.education??[["DEZ-2020","Formação em comunicação e criação","Instituição (exemplo)"]]};
}
const cache = new Map<string, Portfolio>();

/** Portfólio fictício completo para mostrar o modelo com conteúdo próprio na galeria. */
export function demoFor(templateId: string): Portfolio {
  const hit = cache.get(templateId);
  if (hit) return hit;
  const tpl = templateById(templateId);
  const spec = SPECS[tpl.id];
  const [city, state] = spec.city.split("/");
  const handle = slugify(spec.name).replace(/-/g, "");
  const tl = (rows: [string, string, string][] = []) => rows.map(([period, title, org]) => ({ id: uid(), period, title, org }));
  const portfolio: Portfolio = {
    profile: {
      photo: examplePortrait(spec.role, spec.name), photoFocus: { x: 68, y: 35 }, name: spec.name, headline: spec.headline, roleId: spec.role, city, state, bio: spec.bio,
      email: `${handle}@exemplo.com.br`, whatsapp: "", instagram: handle, linkedin: handle, website: "",
      available: true,
      stats: spec.stats.map(([value, label]) => ({ value, label })),
      pillars: (spec.pillars ?? []).map(([title, text]) => ({ title, text })),
    },
    works: spec.works.map(([title, kind, category, client, year, _hue, description, extra], index) => ({
      id: uid(), title, kind: KIND[kind], category, client, year, role: "", software: [], tags: [], description,
      cover: exampleCover(spec.role, title, category, index), visibility: "public" as const, ...extra,
    })),
    experience: tl(spec.experience),
    education: tl(spec.education),
    testimonials: (spec.testimonials ?? []).map(([quote, author, role]) => ({ id: uid(), quote, author, role })),
    team: (spec.team ?? []).map(([name, role], i) => ({ id: uid(), name, role, photo: examplePortrait(i % 2 ? "editor" : "fotografo", name) })),
    faq: (spec.faq ?? []).map(([question, answer]) => ({ id: uid(), question, answer })),
    services: (spec.services ?? []).map(([title, text, price]) => ({ id: uid(), title, text, price })),
    clients: spec.clients ?? [],
    site: { slug: handle, templateId: tpl.id, theme: { ...tpl.theme }, sections: sectionsFrom(tpl.sections), published: true, bilingual: false, passwordProtected: false },
    plan: "essencial",
    aiCredits: 0,
    analytics: { visits: [], contactClicks: 0, topWork: "" },
  };
  cache.set(templateId, portfolio);
  return portfolio;
}

export const DEMO_TEMPLATE_IDS = Object.keys(SPECS);

