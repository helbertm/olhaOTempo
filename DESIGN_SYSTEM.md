# Design System

## Fundamentos

- Tipografia
  - `--type-overline` para labels, chips e metadados.
  - `--type-body-sm` e `--type-body-md` para texto funcional.
  - `--type-title-md`, `--type-brand-md`, `--type-display-lg` e `--type-display-xl` para títulos e destaques.
- Espaçamento
  - escala contínua `--space-1` a `--space-10`.
  - uso preferencial em gaps, paddings e ritmo vertical.
- Densidade
  - `--density-compact`, `--density-default`, `--density-relaxed`.
- Estado
  - `--state-focus-ring` para foco visível.
  - `--state-disabled-opacity` para indisponibilidade.
  - `--state-quiet-opacity` para quiet UI.
  - `--state-hover-raise` para micro-elevação coerente.

## Superfícies

- Painéis
  - `--panel-bg`, `--panel-border`, `--shadow-lg`
  - paddings semânticos `--panel-padding-lg`, `--panel-padding-md`, `--panel-padding-sm`
- Chips e status
  - `--surface-chip-padding-y`, `--surface-chip-padding-x`
- Controles
  - `--control-pill-radius`
  - `--control-padding-y`, `--control-padding-x`
  - tokens temáticos do modo apresentação para estado normal e quiet UI

## Famílias de componente

- `button`
  - famílias `primary`, `secondary`, `ghost`, `danger`, `icon`
  - mesmo raio, padding-base e feedback de hover/focus
- `panel`
  - mesma borda, sombra e linguagem de superfície
- `switch`
  - toggle sempre com semântica nativa de checkbox
- `status`
  - mensagens curtas e cromia funcional (`saved`, `unsaved`, `warning`, `danger`)
- `presentation controls`
  - usam tokens próprios por tema
  - suportam estado `quiet` sem comprometer contraste ou operação em touch

## Regras de evolução

- Evitar novo valor “solto” se já existir token equivalente.
- Preferir token semântico a valor puramente visual.
- Mudanças de componente devem respeitar estados `default`, `hover`, `focus`, `quiet` e `disabled`.
- Ajustes do modo apresentação devem passar primeiro pelos tokens de viewport/contexto e só depois por breakpoint específico.
