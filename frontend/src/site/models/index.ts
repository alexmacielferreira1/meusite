import { MOTION_MODEL_PAGES } from "./MotionModels";
import type { ComponentType } from "react";
import { CoberturaEventos, ComunicacaoCorporativa, DirecaoArte, DirecaoFotografia, Documentarista, EstrategiaConteudo, EstudioCriativo, PodcastProducaoSonora, RedacaoPublicitaria, ReporterTv } from "./models11";
import { ApresentacaoMediacao, Colorista, ComunicacaoPublica, DesignInformacao, EfeitosVisuais, Fotojornalismo, IlustracaoEditorial, ProducaoCriadores, RoteiroAudiovisual, UxWriting } from "./models21";
import { ArquivoEditorial, CampanhasResultados, CaseEmProfundidade, CurriculoComTrabalhos, EquipeProjetos, PortfolioCompacto, ProjetosDigitais, ProjetosEducacionais, ServicosOrcamento, VitrineMultidisciplinar } from "./models31";
import { Documental, Editorial, GradeSuica, Impacto, Mosaico } from "./modelsExtras";
import { AssessoriaImprensa, DesignerGrafico, EditorPro, Fotografia, Jornalismo, LocucaoAudio, MotionDesign, ProducaoAudiovisual, SocialMedia, Videomaker } from "./models01";

/** Modelos com página exclusiva. Estrutura fixa; o usuário altera cor de destaque, tipografia e cantos. */
export const MODEL_PAGES: Record<string, ComponentType> = {
  ...MOTION_MODEL_PAGES,
  "editor-pro": EditorPro,
  "videomaker": Videomaker,
  "producao-audiovisual": ProducaoAudiovisual,
  "designer-grafico": DesignerGrafico,
  "motion-design": MotionDesign,
  "fotografia": Fotografia,
  "jornalismo": Jornalismo,
  "social-media": SocialMedia,
  "assessoria-imprensa": AssessoriaImprensa,
  "locucao-audio": LocucaoAudio,
  "direcao-fotografia": DirecaoFotografia,
  "documentarista": Documentarista,
  "reporter-tv": ReporterTv,
  "direcao-arte": DirecaoArte,
  "redacao-publicitaria": RedacaoPublicitaria,
  "podcast-producao-sonora": PodcastProducaoSonora,
  "cobertura-eventos": CoberturaEventos,
  "comunicacao-corporativa": ComunicacaoCorporativa,
  "estrategia-conteudo": EstrategiaConteudo,
  "estudio-criativo": EstudioCriativo,
  "colorista": Colorista,
  "efeitos-visuais": EfeitosVisuais,
  "roteiro-audiovisual": RoteiroAudiovisual,
  "ilustracao-editorial": IlustracaoEditorial,
  "fotojornalismo": Fotojornalismo,
  "design-informacao": DesignInformacao,
  "apresentacao-mediacao": ApresentacaoMediacao,
  "comunicacao-publica": ComunicacaoPublica,
  "ux-writing": UxWriting,
  "producao-criadores": ProducaoCriadores,
  "vitrine-multidisciplinar": VitrineMultidisciplinar,
  "case-em-profundidade": CaseEmProfundidade,
  "portfolio-compacto": PortfolioCompacto,
  "servicos-orcamento": ServicosOrcamento,
  "curriculo-com-trabalhos": CurriculoComTrabalhos,
  "arquivo-editorial": ArquivoEditorial,
  "campanhas-resultados": CampanhasResultados,
  "projetos-digitais": ProjetosDigitais,
  "projetos-educacionais": ProjetosEducacionais,
  "equipe-projetos": EquipeProjetos,
  "grade-suica": GradeSuica,
  "editorial": Editorial,
  "impacto": Impacto,
  "documental": Documental,
  "mosaico": Mosaico,
};

export const hasFixedStructure = (templateId: string) => templateId in MODEL_PAGES;

