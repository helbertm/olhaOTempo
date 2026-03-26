# MICHELANGELO_DA_VINCI_REANALYSIS

## Identificação

- Agente: Michelangelo da Vinci
- Modelo declarado na definição do agente: `gpt-5.4`
- Nível de reasoning declarado: `high`
- Data da reanálise: 2026-03-26
- Escopo: revalidação completa do projeto após os 13 commits do relatório original
- Implementação: não realizada nesta etapa

## Resumo executivo

O projeto evoluiu de forma material. A arquitetura está mais limpa, o núcleo de tempo permanece sólido, o modo apresentação foi desacoplado em módulos coerentes, o design system passou a existir de maneira explícita, há guardrails locais de qualidade e a documentação ficou bem mais honesta em relação ao estado real do produto.

Dos 13 itens do relatório original, 9 estão resolvidos de forma convincente e 4 estão parcialmente resolvidos. Não encontrei item do relatório original ainda totalmente pendente no sentido estrito do escopo prometido por cada commit. Ainda assim, há um ponto remanescente relevante: a tela de apresentação compacta continua sensível demais a viewport pequena, orientação e comprimento do título. Em paralelo, a acessibilidade dos switches da configuração ainda não está semanticamente correta para leitor de tela, porque os checkboxes não recebem nome acessível do texto visual ao lado.

Validação executada nesta reanálise:

- `npm test`: aprovado, 29 testes passando
- `npm run verify`: aprovado, incluindo guardrails de formatação, sintaxe, HTML, CSS e testes

Veredito atual: **quase pronto**, mas ainda exige **uma rodada adicional relevante** focada em responsividade real de iPhone/iPad e acessibilidade dos controles de configuração antes de ser tratado como “filé” em robustez de frontend.

## Status dos 13 itens do relatório original

| # | Commit | Item original | Status atual | Avaliação |
| --- | --- | --- | --- | --- |
| 1 | `5254133` | Rebuild presentation viewport model | **Parcialmente resolvido** | O projeto agora tem um modelo explícito de viewport em [`js/presentation-layout.js`](js/presentation-layout.js:1-39), tokens por modo em [`styles.css`](styles.css:868-959) e testes dedicados em [`tests/presentation-layout.test.js`](tests/presentation-layout.test.js:1-35). Porém a estratégia ainda é coarse-grained demais para cenários móveis reais, e o layout continua sujeito a corte/clipping em compacto. |
| 2 | `fd8b6bc` | Modularize app responsibilities | **Resolvido** | A antiga concentração em `app.js` foi reduzida de forma real. Hoje há módulos claros como [`js/app-bootstrap.js`](js/app-bootstrap.js:1-56), [`js/presentation-controls.js`](js/presentation-controls.js:1-297), [`js/presentation-ui.js`](js/presentation-ui.js:1-259), [`js/state-sync.js`](js/state-sync.js:1-180) e [`js/ui-config.js`](js/ui-config.js:1-223). [`js/app.js`](js/app.js:1-447) virou coordenador. |
| 3 | `d29662c` | Split presentation structural and timed rendering | **Resolvido** | O render estrutural, o render dos clocks e o render do alerta agora estão separados em [`js/presentation-ui.js`](js/presentation-ui.js:130-223), com cache estrutural em `app.presentationRenderCache`. Isso reduz bastante o retrabalho por tick. |
| 4 | `d25e238` | Unify switch semantics and theme selection a11y | **Parcialmente resolvido** | Houve melhora real: o seletor de tema virou `radiogroup` com botões `role="radio"` e estados coerentes em [`index.html`](index.html:70-79) e [`js/ui-config.js`](js/ui-config.js:18-40,213-223). Porém os switches continuam sem nome acessível correto, porque o texto visual não está semanticamente associado ao checkbox. |
| 5 | `3f792fb` | Refine presentation controls into quiet UI | **Parcialmente resolvido** | O quiet UI existe e está bem melhor que antes em [`styles.css`](styles.css:1128-1219), mas em viewport compacta os controles ainda consomem orçamento vertical importante e continuam interferindo na leitura do conteúdo principal. |
| 6 | `fc4fd9a` | Add reduced-motion and live announcement strategy | **Resolvido** | O app agora trata `prefers-reduced-motion` em [`styles.css`](styles.css:1307-1328) e possui live region dedicada em [`index.html`](index.html:316-317) com anúncio via [`js/notifications.js`](js/notifications.js:1-24). |
| 7 | `1cdc5ef` | Formalize frontend design system tokens | **Resolvido** | Os tokens centrais foram formalizados em [`styles.css`](styles.css:1-69) e documentados em [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md:1-36). A linguagem visual está mais sistêmica do que no estado anterior. |
| 8 | `1ec540f` | Remove duplicate theme source of truth | **Resolvido** | A duplicação estrutural antiga foi removida. O tema hoje é controlado por `themeSwitchGroup` e estado persistido, sem `select` escondido paralelo, em [`index.html`](index.html:70-79), [`js/ui-config.js`](js/ui-config.js:71-79,213-223) e [`js/state-sync.js`](js/state-sync.js:50-67). |
| 9 | `06b1d1f` | Reorganize configuration into guided sections | **Resolvido** | A configuração está melhor hierarquizada em grupos e disclosure avançado em [`index.html`](index.html:45-227), com melhoria clara de orientação de uso. |
| 10 | `4dbe9a8` | Simplify settings invariants and comparison logic | **Resolvido** | A comparação estrutural hoje é explícita em [`js/model.js`](js/model.js:231-275), a normalização garante ao menos uma etapa em [`js/model.js`](js/model.js:90-122) e há testes cobrindo round-trip em [`tests/storage.test.js`](tests/storage.test.js). |
| 11 | `ede6950` | Add presentation UI and markup guardrail tests | **Parcialmente resolvido** | Há melhoria concreta com [`tests/markup-a11y.test.js`](tests/markup-a11y.test.js:1-14) e [`tests/presentation-ui.test.js`](tests/presentation-ui.test.js:1-77). Ainda falta, porém, proteção em navegador real para layout/responsividade e para nomes acessíveis de formulário. |
| 12 | `0ed7eae` | Add local quality guardrail scripts | **Resolvido** | O projeto agora tem `check:format`, `check:js`, `check:html`, `check:styles` e `verify` em [`package.json`](package.json:1-12), com scripts locais em [`scripts/`](scripts). |
| 13 | `60d3e27` | Align README with validation and governance | **Resolvido** | O README está compatível com o aparato atual de validação e governança em [`README.md`](README.md:1-180). |

## Achados remanescentes

### Imprescindível

#### 1. O modo apresentação compacto ainda pode cortar conteúdo e desperdiçar viewport em iPhone

- Área: UI/UX, responsividade
- Evidência:
  - [`styles.css`](styles.css:787-809)
  - [`styles.css`](styles.css:868-959)
  - [`styles.css`](styles.css:1026-1049)
  - [`styles.css`](styles.css:1128-1147)
  - [`styles.css`](styles.css:1343-1401)
  - [`js/presentation-layout.js`](js/presentation-layout.js:21-39)
- Diagnóstico:
  O projeto avançou ao sair de uma cascata ainda mais caótica, mas o modelo final continua combinando apenas quatro modos amplos de viewport com sizing heurístico baseado em `min(vw, vh, rem)` e uma superfície principal com `overflow: hidden`. Isso deixa o layout frágil em dispositivos pequenos, sobretudo quando o topo de controles, um título longo e dois timers competem pelo mesmo orçamento vertical. O próprio CSS atual confirma esse acoplamento: há regras específicas de modo compacto, regras globais móveis para todos os botões e uma barra de controles ainda instalada acima do conteúdo crítico.
- Impacto:
  Este é o fluxo central do produto. Se o modo apresentação continua cortando ou apertando demais o conteúdo em iPhone, a estabilidade funcional do app em palco ainda não está no nível esperado.
- Status frente ao relatório original:
  **Parcialmente resolvido**. A base está melhor, mas a falha de produto ainda aparece no cenário mais sensível.

### Alta Criticidade

#### 2. Os switches de configuração continuam sem nome acessível correto

- Área: acessibilidade
- Evidência:
  - [`index.html`](index.html:89-145)
  - [`index.html`](index.html:199-217)
  - [`tests/markup-a11y.test.js`](tests/markup-a11y.test.js:1-14)
  - [`scripts/check-html.mjs`](scripts/check-html.mjs:1-20)
- Diagnóstico:
  Os checkboxes são nativos, o que foi um avanço, mas o texto visível do controle está em um bloco irmão (`.config-switch-copy`) e não dentro de um `<label>` associado, nem referenciado por `aria-labelledby`. Na prática, o leitor de tela pode anunciar apenas “checkbox” sem o nome funcional do ajuste. O guardrail atual não captura esse problema porque valida apenas alguns padrões estruturais amplos.
- Impacto:
  Esse é um problema real de operação e compreensão para navegação assistiva na tela de configuração.
- Status frente ao relatório original:
  **Parcialmente resolvido**. A semântica melhorou, mas não foi concluída corretamente.

#### 3. O quiet UI melhorou, mas ainda está acoplado a regras móveis genéricas que prejudicam a apresentação compacta

- Área: UI/UX, design system, responsividade
- Evidência:
  - [`styles.css`](styles.css:1128-1219)
  - [`styles.css`](styles.css:1343-1401)
- Diagnóstico:
  O componente de controles da apresentação tem regras próprias bem definidas, mas na faixa `max-width: 760px` o stylesheet volta a aplicar uma regra genérica para todos os botões (`width: 100%`). Isso reintroduz acoplamento entre a UI da configuração e a UI da apresentação, enfraquecendo a intenção do quiet UI justamente onde o layout já está mais pressionado.
- Impacto:
  Em mobile, o topo de controles continua maior e mais invasivo do que deveria, com efeito direto na leitura do título e dos timers.
- Status frente ao relatório original:
  **Parcialmente resolvido**. A direção está correta, mas a implementação ainda não ficou robusta em compacto.

### Média Criticidade

#### 4. O título da etapa ainda não tem proteção suficiente para textos longos no modo apresentação

- Área: UI/UX, responsividade
- Evidência:
  - [`styles.css`](styles.css:1026-1038)
  - [`js/presentation-ui.js`](js/presentation-ui.js:41-52,62-68)
- Diagnóstico:
  O cabeçalho monta combinações úteis como `ATUAL -> PRÓXIMA`, mas o bloco visual não adota uma estratégia explícita para casos de títulos longos: não há `text-wrap: balance`, `overflow-wrap`, limitação de linhas ou escala baseada em comprimento do texto. Em viewport pequena, isso compete diretamente com o orçamento do timer.
- Impacto:
  O comportamento visual pode variar demais com o conteúdo real do roteiro, o que enfraquece a previsibilidade da tela principal.
- Status frente ao relatório original:
  **Novo achado remanescente**, revelado pelo estado final e pelo foco maior em iPhone.

#### 5. Os testes e guardrails cresceram, mas ainda não cobrem a camada browser-level que mais sofre regressão

- Área: qualidade de código frontend, responsividade, acessibilidade
- Evidência:
  - [`package.json`](package.json:1-12)
  - [`tests/presentation-layout.test.js`](tests/presentation-layout.test.js:1-35)
  - [`tests/presentation-ui.test.js`](tests/presentation-ui.test.js:1-77)
  - [`tests/markup-a11y.test.js`](tests/markup-a11y.test.js:1-14)
  - [`scripts/check-html.mjs`](scripts/check-html.mjs:1-20)
  - [`scripts/check-styles.mjs`](scripts/check-styles.mjs:1-18)
- Diagnóstico:
  A cobertura atual é boa para modelo, sintaxe e alguns contratos estruturais. O que ainda não existe é validação em navegador real ou headless para o que mais quebrou ao longo do projeto: viewport móvel, layout em orientação diferente e acessibilidade de formulário real.
- Impacto:
  O projeto depende demais de smoke test manual justamente nas áreas mais instáveis.
- Status frente ao relatório original:
  **Parcialmente resolvido**. O item 11 avançou, mas ainda não fecha a blindagem da UI crítica.

### Baixa Criticidade

#### 6. Há um pequeno resíduo de modelo não utilizado na criação de alertas padrão

- Área: Clean Code, qualidade de código frontend
- Evidência:
  - [`js/defaults.js`](js/defaults.js:64-70)
  - Busca no projeto: `order:` só aparece em [`js/defaults.js`](js/defaults.js:64-70)
- Diagnóstico:
  `createDefaultSection()` ainda injeta a propriedade `order` nos alertas padrão, mas ela não é lida nem preservada no restante do sistema. É ruído pequeno, porém desnecessário.
- Impacto:
  Baixo. É débito técnico leve e localizado.

#### 7. O título do documento pode ficar duplicado quando o título configurado é o nome padrão do app

- Área: UI/UX, Clean Code
- Evidência:
  - [`js/ui-config.js`](js/ui-config.js:185-188)
- Diagnóstico:
  Com o título padrão `"De olho no tempo"`, o documento vira `"De olho no tempo · De olho no tempo"`. Não quebra nada, mas é um acabamento abaixo do restante do projeto.
- Impacto:
  Baixo. É polimento de experiência e consistência textual.

## Nova avaliação por eixo

### UI/UX

- Melhorou bastante. A tela de configuração está mais guiada, o tema tem seletor visual mais coerente e o modo apresentação agora tem hierarquia mais clara de estado.
- O principal ponto em aberto é o comportamento em viewport móvel compacta. O app transmite melhor sua proposta, mas ainda não sustenta com plena consistência a execução em iPhone nos cenários mais apertados.

### Responsividade

- Houve progresso estrutural real com `presentation-layout`, tokens por viewport e uma organização muito melhor do CSS da apresentação.
- Mesmo assim, o modelo ainda é mais heurístico do que content-aware. O corte de conteúdo permanece plausível por causa da combinação entre `overflow: hidden`, topbar fixa no topo do orçamento, sizing agressivo e apenas quatro classes globais de viewport.

### Acessibilidade

- Melhorias concretas: `radiogroup` de tema, timers marcados com `role="timer"`, live region dedicada, tratamento de `prefers-reduced-motion`.
- Problema remanescente relevante: os switches continuam sem associação semântica correta entre texto e checkbox.

### Design system

- Este eixo saiu da fase “intenção” e entrou em um estado funcional. Os tokens existem, foram documentados e aparecem de forma transversal no CSS.
- O que falta agora é manter a disciplina de contexto: algumas regras móveis genéricas ainda vazam para o modo apresentação e prejudicam a coesão do sistema.

### Frontend code quality

- O salto de qualidade arquitetural é inegável. O sistema ficou mais modular, mais testável e menos acoplado.
- Os guardrails locais também melhoraram muito o baseline.
- O próximo passo não é “mais modularização”; é fechar as últimas fragilidades de interface real e cobertura browser-level.

## Sweep de Clean Code em HTML/CSS/JS

### HTML

- Estrutura geral boa e legível.
- Separação clara entre configuração, apresentação, templates e regiões auxiliares.
- Ponto fraco remanescente: switches sem associação acessível correta entre rótulo visual e input em [`index.html`](index.html:89-145,199-217).

### CSS

- O stylesheet está mais sistêmico e semanticamente tokenizado.
- A parte de apresentação ficou mais organizada do que no relatório original.
- O principal smell atual não é bagunça; é **acoplamento contextual residual**:
  - regras próprias do modo apresentação coexistem com overrides móveis genéricos;
  - a viewport compacta ainda depende demais de fórmulas heurísticas;
  - `overflow: hidden` em uma tela cujo conteúdo varia com orientação e texto é uma escolha de risco em cenário real.

### JavaScript

- A modularização foi bem-sucedida.
- `js/app.js` deixou de ser gargalo arquitetural.
- `js/presentation-ui.js` está mais limpo e orientado a view model/cache.
- Resíduos pequenos ainda existem, como a propriedade `order` órfã em [`js/defaults.js`](js/defaults.js:64-70), mas isso já é detalhe, não problema estrutural.

## Conclusão final

O projeto **não está mais no estado crítico** descrito no relatório original. A maior parte das recomendações foi absorvida com qualidade, e isso aparece tanto na arquitetura quanto nos testes e na governança local.

O produto, porém, **ainda não está “pronto-pronto”** para declarar zero débito técnico no frontend. Ele está **quase pronto**, com **uma rodada adicional relevante** ainda justificável por dois motivos concretos:

1. o modo apresentação compacto ainda não está suficientemente robusto para iPhone em uso real;
2. a acessibilidade dos switches da configuração ainda está semanticamente incompleta.

Se essas duas frentes forem fechadas, aí sim o projeto passa a ter perfil de produto frontend muito maduro para o escopo proposto.

## Lista final de tasks recomendadas

1. Reprojetar o layout compacto do modo apresentação para `compact-portrait` e `compact-landscape` com orçamento espacial explícito por região.
   Objetivo: parar de depender principalmente de fórmulas heurísticas de `vw`/`vh`/`dvh` e garantir que topo, título e timers sempre caibam sem corte em iPhone.

2. Remover o acoplamento entre regras móveis genéricas e a UI do modo apresentação.
   Objetivo: impedir que regras como `width: 100%` para botões em `@media (max-width: 760px)` continuem vazando da configuração para os controles da apresentação.

3. Revisar a barra de controles do modo apresentação em viewport compacta.
   Objetivo: reduzir a altura ocupada, definir comportamento próprio para retrato e paisagem e evitar que os controles roubem espaço dos timers.

4. Trocar `overflow: hidden` da moldura principal da apresentação por uma estratégia segura para conteúdo variável.
   Objetivo: eliminar clipping silencioso quando o título for longo, a orientação mudar ou o navegador entregar uma viewport menor que a prevista.

5. Implementar estratégia explícita para títulos longos no cabeçalho da apresentação.
   Objetivo: definir `wrapping`, balanceamento, limite de linhas e/ou escala baseada no comprimento do texto para `ATUAL -> PRÓXIMA` sem comprometer o timer.

6. Corrigir a acessibilidade dos switches da configuração associando semanticamente cada texto visível ao seu `checkbox`.
   Objetivo: garantir nome acessível correto para leitor de tela via `<label>` completo ou `aria-labelledby` em todos os switches.

7. Adicionar testes/guardrails que validem a acessibilidade real dos switches e não apenas padrões estruturais amplos.
   Objetivo: impedir regressão futura no vínculo entre rótulo visual e controle interativo.

8. Adicionar cobertura de teste para layout de apresentação em cenários compactos reais.
   Objetivo: cobrir pelo menos estados críticos como iPhone em retrato, iPhone em paisagem, título curto, título longo, layout `dual`, layout `single` e overtime.

9. Revisar os tokens e regras do quiet UI para manter contraste e discrição sem sacrificar operação em touch.
   Objetivo: consolidar o comportamento dos controles em execução como parte do design system, sem depender de exceções por breakpoint.

10. Remover a propriedade órfã `order` dos alertas padrão ou integrá-la formalmente ao modelo se ela tiver função futura.
    Objetivo: eliminar ruído de Clean Code em `js/defaults.js`.

11. Ajustar a lógica do título do documento para evitar duplicação quando o título configurado for igual ao nome do app.
    Objetivo: melhorar acabamento textual e consistência da experiência.
