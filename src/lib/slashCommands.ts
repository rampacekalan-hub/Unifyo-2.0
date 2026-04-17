// src/lib/slashCommands.ts
// Slash-command registry for chat input. Typing "/" opens a suggestions popup;
// picking one either (a) sends a pre-baked prompt directly, or (b) inserts a
// template into the input so the user can fill variables before sending.

export interface SlashCommand {
  id: string;
  trigger: string;        // without leading slash
  label: string;
  description: string;
  icon: string;
  // Pre-baked full prompt → sends immediately on select.
  prompt?: string;
  // Template inserted into input for user to complete.
  template?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: "kontakt",
    trigger: "kontakt",
    label: "/kontakt",
    description: "Pridaj nový kontakt do CRM",
    icon: "👤",
    template: "Pridaj kontakt: meno, telefón, email, firma, poznámka",
  },
  {
    id: "stretnutie",
    trigger: "stretnutie",
    label: "/stretnutie",
    description: "Naplánuj stretnutie / úlohu",
    icon: "📅",
    template: "Naplánuj stretnutie s … dňa … o … — poznámka: …",
  },
  {
    id: "email",
    trigger: "email",
    label: "/email",
    description: "Navrhni email klientovi",
    icon: "✉️",
    template: "Navrhni email pre … na tému …",
  },
  {
    id: "zhrn",
    trigger: "zhrn",
    label: "/zhrn",
    description: "Zhrň môj deň",
    icon: "📋",
    prompt: "Zhrň môj dnešok: aké úlohy mám, aké sú najdôležitejšie, čo som odložil.",
  },
  {
    id: "followup",
    trigger: "followup",
    label: "/followup",
    description: "Follow-up pre posledný kontakt",
    icon: "🔁",
    template: "Priprav follow-up správu pre kontakt: …",
  },
  {
    id: "preklad",
    trigger: "preklad",
    label: "/preklad",
    description: "Preklad textu",
    icon: "🌐",
    template: "Prelož do angličtiny: …",
  },
  {
    id: "pomoc",
    trigger: "pomoc",
    label: "/pomoc",
    description: "Čo všetko viem robiť?",
    icon: "💡",
    prompt: "Čo všetko vieš robiť? Daj mi stručný zoznam mojich možností v Unifyo.",
  },
];

// Match commands whose trigger starts with the user's query (case-insensitive).
export function matchCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((c) =>
    c.trigger.toLowerCase().startsWith(q) ||
    c.description.toLowerCase().includes(q),
  );
}

// Detect a leading slash-token in the input and return the query after `/`.
// Returns null when the input doesn't begin with `/` or already contains spaces
// beyond the trigger (we only show suggestions while the user is still typing
// the command name).
export function extractSlashQuery(input: string): string | null {
  if (!input.startsWith("/")) return null;
  const rest = input.slice(1);
  // If there's a space, the trigger is already picked — stop suggesting.
  if (rest.includes(" ")) return null;
  return rest;
}
