# Movimento por cenas — MeuSite e referência para evolução posterior do Folios

## Decisão de direção

Não repetir um parallax genérico nem acrescentar o mesmo objeto 3D em todos os sites. O movimento deve organizar a história do negócio e conduzir à ação. A primeira versão tem uma base de enquadramento, ponteiro e revelações; o sistema de cenas abaixo é planejamento técnico para a próxima evolução.

## Contrato proposto

```ts
type MotionRecipe = {
  family: 'food'|'property'|'service'|'beauty'|'pet'|'fitness'|'travel'|'commerce';
  scenes: {
    target: string;
    trigger: 'enter'|'scroll'|'pointer'|'action';
    effect: 'reveal'|'mask'|'crossfade'|'camera'|'split'|'depth'|'gallery';
    range?: [number, number];
    duration: number;
    intensity: number;
    mediaSource?: string;
    touchAlternative: string;
    reducedMotionAlternative: string;
  }[];
};
```

Persistir a receita por modelo e permitir personalizar intensidade e mídia sem editar código. Dados e textos vêm do documento do cliente. Não criar campos obrigatórios só para preencher um efeito.

## Receitas por objetivo

| Família | Cena de entrada | Rolagem | Ponteiro/ação | Alternativa leve |
|---|---|---|---|---|
| Alimentação | Close de produto em quadro | Ingredientes/combos em sequência | Montagem e adicionais com retorno visual | Fotos e cartões sem movimento |
| Imóveis | Plano geral do ambiente real | Planta, ambientes e ficha | Hotspots de visita real | Galeria de fotos com legendas |
| Serviços | Problema → solução → resultado | Processo em etapas | Comparação quando há material autorizado | Lista de serviços e orçamento |
| Beleza | Retrato e detalhe editorial | Serviços/equipe em camadas | Escolha de serviço e profissional | Agenda/formulário simples |
| Pet | Narrativa próxima e acolhedora | Espaço, cuidados e rotina | Seleção de programa/hospedagem | Fotos, informações e solicitação |
| Fitness | Enquadramento com ritmo | Aulas/ambiente em sequência | Comparar planos e pedir aula | Tabela e formulário acessíveis |
| Turismo | Sequência de paisagem/local | Roteiro e experiência | Explorar quartos/passeios reais | Galeria e datas desejadas |
| Comércio | Produto com detalhe e material | Coleções com mudanças de enquadramento | Variação e seleção de compra | Catálogo e carrinho completos |

## Implementação incremental

1. Definir estados e storyboard por modelo antes de escrever animações.
2. Criar componentes de cena pequenos, com transform/opacity e observadores; usar frame único por cena e limpeza de eventos.
3. Efeitos de scroll não podem bloquear a rolagem nem ocultar a ação principal.
4. Câmera WebGL/3D só quando a mídia e o objetivo justificarem; carregar sob demanda e oferecer fallback.
5. Vídeo/áudio não começam com som sem ação. Botões não executam compra automaticamente.
6. Testar entrada/saída, rolagem rápida, troca de modelo, toque, teclado, aba oculta e movimento reduzido.
7. Gravar navegador para revisar composição, ritmo e diferença entre modelos.
8. Aplicar a receita a uma família só depois de validar um representante.

## Aceites

Texto e ação acessíveis com efeitos desligados; nenhuma camada intercepta botões; nenhuma perda de conteúdo em celular; pausa fora da tela; orçamento de mídia e processamento; demonstração em aparelho intermediário. Não prometer “cinema completo em 105 modelos” antes de implementar e validar suas receitas.
