export const STORAGE_KEY = "tempo-de-palco:v1";
export const STORAGE_VERSION = 1;
export const MAX_ALERTS_PER_SECTION = 3;
export const DEFAULT_ALERT_HIGHLIGHT_SECONDS = 10;
export const MIN_ALERT_HIGHLIGHT_SECONDS = 5;
export const MAX_ALERT_HIGHLIGHT_SECONDS = 30;

export const THEME_OPTIONS = [
  {
    id: "stage-dark",
    label: "Palco escuro",
    description: "Fundo escuro, contraste frio e leitura forte em auditórios.",
  },
  {
    id: "studio-light",
    label: "Clareza total",
    description: "Base clara de alto contraste para ambientes iluminados.",
  },
  {
    id: "amber-focus",
    label: "Foco âmbar",
    description: "Contraste quente e visual de destaque para telões.",
  },
];

export const DEFAULT_THEME_ID = THEME_OPTIONS[0].id;
