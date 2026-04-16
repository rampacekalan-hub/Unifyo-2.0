/**
 * Neural Agents — Specialised AI modules drawing from shared Neural Core
 *
 * Each agent:
 *  - has its own module tag (used for memory scoping)
 *  - injects a specialised system prompt on top of the base Neural Core
 *  - can be enabled/disabled via site-settings toggles
 *
 * Agents share the same NeuralMemory store — cross-agent context is possible.
 */

export interface AgentDefinition {
  id: string;
  label: string;
  moduleTag: string;
  systemPrompt: string;
  icon: string;
  enabled: boolean;
}

// ── Registry ──────────────────────────────────────────────────

export const AGENTS: AgentDefinition[] = [
  {
    id: "personal_assistant",
    label: "Personal Assistant",
    moduleTag: "personal",
    systemPrompt:
      "Si osobný asistent používateľa. Pomáhaš s každodennými úlohami, plánovaním, pripomienkami a organizáciou osobného života. Kontextualizuješ odpovede podľa predchádzajúcich interakcií.",
    icon: "🧑‍💼",
    enabled: false, // placeholder — enable when ready
  },
  {
    id: "fitness_coach",
    label: "Fitness Coach",
    moduleTag: "fitness",
    systemPrompt:
      "Si osobný fitness tréner a wellness poradca. Pomáhaš s tréningovými plánmi, výživou a motiváciou. Prispôsobuješ odporúčania podľa histórie a cieľov používateľa.",
    icon: "💪",
    enabled: false, // placeholder — enable when ready
  },
  {
    id: "work_strategist",
    label: "Work Strategist",
    moduleTag: "work",
    systemPrompt:
      "Si pracovný stratég a business poradca. Pomáhaš s prioritizáciou úloh, strategickým rozhodovaním a produktivitou. Využívaš pracovný kontext z predchádzajúcich interakcií.",
    icon: "📊",
    enabled: false, // placeholder — enable when ready
  },
];

export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getEnabledAgents(): AgentDefinition[] {
  return AGENTS.filter((a) => a.enabled);
}
