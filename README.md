# De olho no tempo

Aplicação web estática para uso local como timer de apresentação, palestra ou palco. O app permite configurar um roteiro com etapas, alertas visuais por etapa, modo apresentação de alto contraste, tela cheia e wake lock em modo best effort.

Toda a interface está em pt-BR e o estado fica salvo somente no navegador/dispositivo que abriu a aplicação.

## Visão geral

- Stack: HTML5, CSS3 e JavaScript modular sem framework.
- Persistência: `localStorage`, com estrutura versionada e fallback seguro para dados inválidos.
- Modos: edição/configuração e apresentação.
- Timers simultâneos: etapa atual e total.
- Recursos de apresentação: iniciar, pausar, retomar, zerar, tela cheia, wake lock e overtime final.

## Por que app estático + localStorage

O escopo do projeto é individual e local ao navegador:

- não existe conta
- não existe backend
- não existe sincronização entre dispositivos
- cada pessoa monta e salva seu próprio roteiro no próprio navegador

Para esse cenário, `localStorage` atende o v1 com baixa complexidade e boa previsibilidade operacional.

## Estrutura do projeto

- `index.html`: estrutura dos modos de edição e apresentação.
- `styles.css`: layout responsivo, temas, tokens de design system e estados visuais.
- `design_system.md`: fundamentos de tokens, famílias de componente e regras de evolução visual.
- `js/app.js`: orquestração principal do app.
- `js/app-bootstrap.js`: inicialização e registro de eventos.
- `js/ui-config.js`: renderização e sincronização visual da tela de configuração.
- `js/presentation-ui.js`: view model e render da tela de apresentação.
- `js/presentation-controls.js`: sessão da apresentação, fullscreen, wake lock e atalhos.
- `js/state-sync.js`: serialização do formulário, mutações estruturais e persistência.
- `js/dom.js`: mapa centralizado de elementos.
- `js/notifications.js`: toasts e anúncios para live region.
- `js/model.js`: normalização e validação do modelo de dados.
- `js/timer-engine.js`: cálculo do tempo com base em timestamps, avanço automático e overtime.
- `js/capabilities.js`: integrações de Fullscreen API e Screen Wake Lock API.
- `js/storage.js`: leitura/gravação no `localStorage`.
- `scripts/*.mjs`: guardrails locais para sintaxe, HTML, CSS e formatação.
- `tests/*.test.js`: testes de lógica, view model e semântica crítica de markup.

## Modelo de configuração

Configuração global:

- título opcional da apresentação
- os cronômetros visíveis da apresentação usam contagem regressiva
- tema de apresentação: `Palco escuro`, `Clareza total` ou `Foco âmbar`
- duração total manual opcional

Cada etapa do roteiro:

- título
- duração
- até 3 alertas
- cada alerta tem tempo decorrido, duração do destaque e cor própria

## Modelo de tempo

O motor de tempo não depende apenas de `setInterval`. O cálculo principal usa timestamps:

- ao iniciar, o app registra `startedAtMs`
- ao pausar, registra `pausedAtMs`
- ao retomar, acumula o tempo pausado em `pausedAccumulatedMs`
- a cada render, o tempo efetivo é recalculado com base no relógio do sistema

Com isso o app continua consistente mesmo quando:

- a aba perde foco
- a página fica temporariamente oculta
- o navegador atrasa updates visuais
- a aplicação é recarregada com a sessão ainda ativa

## Modelo de alertas

- alertas são sempre por etapa
- o gatilho é o tempo decorrido dentro da etapa atual
- o destaque visual tem duração configurável entre 5 e 30 segundos
- não há som, vibração nem alertas globais

## Overtime final

Quando a última etapa termina:

- o app sai do layout normal de etapas
- mostra apenas um grande relógio vermelho
- o valor aparece com sinal negativo
- o destaque pisca de forma lenta e discreta

Importante: esse overtime final é baseado no término do roteiro por etapas. Se você configurar uma meta total manual maior que a soma das etapas, o overtime final ainda começa quando a última etapa termina.

## Temas e contraste

Os três temas foram desenhados para cenários diferentes:

- `Palco escuro`: auditórios e ambientes escuros
- `Clareza total`: salas iluminadas ou projeções claras
- `Foco âmbar`: contraste quente para telões e leitura à distância

Em todos os temas:

- a tipografia principal é grande
- o timer usa fonte monoespaçada
- a cor não é o único indicador de estado
- o layout continua legível em telas menores

## Fullscreen

O app usa a Fullscreen API quando o navegador permite.

Limitações reais:

- a entrada em tela cheia depende de gesto do usuário
- alguns navegadores bloqueiam a tentativa
- sair da tela cheia pode acontecer por ação do usuário ou do sistema
- o layout continua funcional fora da tela cheia

### iPhone e iPad

Em Safari e navegadores baseados em WebKit no iOS, o comportamento de tela cheia no navegador comum é mais limitado. Para ter uma experiência sem barras do navegador:

- publique o app em HTTPS, como no GitHub Pages
- use `Compartilhar` -> `Adicionar à Tela de Início`
- abra o app a partir do ícone instalado

O projeto já inclui `manifest.webmanifest`, `apple-touch-icon`, `apple-mobile-web-app-capable` e ajustes de safe area para esse modo instalado.

## Wake lock

O app usa a Screen Wake Lock API em modo best effort.

Limitações reais:

- nem todo navegador suporta a API
- o navegador ou sistema pode revogar o wake lock
- bateria fraca, economia de energia ou perda de foco podem interromper o recurso
- ao voltar para a aba visível, o app tenta reacquirir o wake lock se a pessoa ainda quiser esse modo

O app não promete impedir suspensão do sistema operacional em 100% dos casos.

## localStorage

O estado fica salvo na chave:

- `tempo-de-palco:v1`

O conteúdo persistido inclui:

- configurações da apresentação
- lista de etapas
- alertas
- view atual
- sessão do timer com timestamps

Se o `localStorage` estiver vazio, o app abre com um modelo inicial. Se houver dados malformados, o app descarta o salvamento inválido e carrega um estado seguro.

## Rodando localmente

Use um servidor estático local para evitar comportamentos inconsistentes com `file://`.

### Opção simples

```bash
python3 -m http.server 4173
```

Depois abra [http://localhost:4173](http://localhost:4173).

## Testes

O projeto usa o test runner nativo do Node e scripts locais de verificação.

```bash
npm test
```

Validação completa local:

```bash
npm run verify
```

Cobertura atual de lógica:

- cálculo do tempo por etapa
- cálculo do tempo total
- disparo de alertas
- avanço automático de etapa
- transição para overtime
- carga e salvamento em `localStorage`
- fallback para armazenamento inválido
- comparação estrutural de configurações
- view model da apresentação para estados `dual`, `single` e cabeçalho
- guardrails de markup para `radiogroup`, timers sem live region contínua e live region dedicada

Scripts de higiene:

- `npm run check:format`: tabs e trailing whitespace
- `npm run check:js`: sintaxe de todos os módulos JS
- `npm run check:html`: semântica mínima esperada do HTML principal
- `npm run check:styles`: tokens e guardrails críticos de CSS

## Governança de frontend

- O contrato visual base está em `design_system.md`.
- Mudanças de UI devem preferir tokens semânticos já existentes em vez de novos valores soltos.
- O projeto tem guardrails locais automatizados, mas ainda não usa screenshot diff nem engine externa de acessibilidade.
- Responsividade e leitura à distância continuam exigindo smoke test manual em navegador real, principalmente em iPhone/iPad e cenários de fullscreen/PWA.

## Limitações intencionais de v1

Não faz parte deste escopo:

- backend
- contas
- sincronização em nuvem
- alertas sonoros
- vibração
- colaboração em tempo real
- importação/exportação

## Próximas etapas

Roadmap de evoluções desejadas:

### Prioridade alta

- [ ] exportação e importação das configurações em arquivo para manter backup ou enviar para outras pessoas
- [ ] permitir trabalhar com mais de uma apresentação simultaneamente, salvando-as no `localStorage`

### Prioridade média

- [ ] usar recursos de áudio nos alertas
- [ ] permitir mais personalizações dos alertas

### Prioridade baixa

- [ ] tradução da interface para outros idiomas
