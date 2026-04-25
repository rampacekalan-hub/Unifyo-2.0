export type ActionCardType = "contact" | "task" | "company" | "event" | "deal";

export interface ActionCard {
  id: string;
  type: ActionCardType;
  status: "pending" | "confirmed" | "dismissed";
  fields: Record<string, string>;
  targetModule: "crm" | "calendar";
  rawText: string;
  missingRequiredFields?: string[];
  extractionDebug?: ExtractionDebug;
}

interface ExtractionDebug {
  classifiedWords: Array<{ word: string; type: "person" | "intent" | "title" | "other" }>;
  chosenName: string;
  confidence: number;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ═════════════════════════════════════════════════════════════════
// VISUAL DEBUG — Console logging for extraction troubleshooting
// ═════════════════════════════════════════════════════════════════
const DEBUG_ENABLED = process.env.NODE_ENV !== "production";

function debugExtraction(text: string, result: { name: string; note: string; classified: Array<{ word: string; type: string }>; confidence: number }) {
  if (!DEBUG_ENABLED) return;
  console.group("🔍 EXTRACTION DEBUG");
  console.log("Input:", text);
  console.log("Classified words:", result.classified.map(c => `${c.word}=${c.type}`).join(", "));
  console.log("Chosen name:", result.name || "(empty)");
  console.log("Confidence:", result.confidence + "%");
  console.groupEnd();
}

// ═════════════════════════════════════════════════════════════════
// ZERO TOLERANCE STRIP — Remove ALL code fragments from display
// ═════════════════════════════════════════════════════════════════
export function stripActionCardBlocks(text: string): string {
  let out = text;

  const aggressiveBlockPattern = /(?:```|\{)[\s\S]*?"type"[\s\S]*?(?:```|\})/gi;
  out = out.replace(aggressiveBlockPattern, "");
  out = out.replace(/```[\s\S]*?(?:action|card|type)[\s\S]*?```/gi, "");
  out = out.replace(/```[\s\S]*$/gi, "");
  out = out.replace(/\s*[-\w]*card\s*\}/gi, "");
  out = out.replace(/\s*\}\s*\}/g, "");

  const lines = out.split("\n");
  const clean: string[] = [];
  for (const line of lines) {
    const isCodeLine = /["']type["']\s*:|\{[^{}]*["']contact["']|\{[^{}]*["']task["']|action-card|```/.test(line);
    const isBraceOnly = /^\s*[{}\[\]]\s*$/.test(line);
    if (isCodeLine || isBraceOnly) continue;
    clean.push(line);
  }
  out = clean.join("\n");

  out = out.replace(/\{\s*\}/g, "");
  out = out.replace(/```/g, "");
  out = out.replace(/action-card/gi, "");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[ \t]+/g, " ");

  // Trim trailing junk that AI sometimes appends after closing fence:
  // digits after sentence-ending punctuation ("stretávate?0" → "stretávate?"),
  // lone digits ("karty 0" → "karty"), orphan braces/backticks.
  out = out.replace(/([.?!])\s*\d+\s*$/u, "$1");
  out = out.replace(/\s*\d+\s*$/u, (m) => (/[.?!]/.test(m) ? m : ""));
  out = out.replace(/\s*[`}{\[\]]+\s*$/u, "");

  // Replace literal placeholders AI sometimes echoes — "[NAME]", "[MENO]", "[EMAIL]".
  out = out.replace(/\[(?:NAME|MENO|EMAIL|TEL|TELEFON|TELEFÓN|FIRMA|DATUM|DÁTUM|CAS|ČAS)\]/gi, "").replace(/ {2,}/g, " ");

  return out.trim();
}

// ═════════════════════════════════════════════════════════════════
// ZERO-VISIBILITY MASK — Replace action-card blocks with animation
// During streaming, when AI starts outputting JSON, show "Spracovávam..."
// ═════════════════════════════════════════════════════════════════
export function maskActionCardBlocks(text: string): string {
  // Check if text contains action-card block start
  const hasActionCard = /```action-card/.test(text);
  
  if (!hasActionCard) {
    // No action card yet, return as-is
    return text;
  }
  
  // Replace the entire action-card block with placeholder
  // This hides JSON from user during streaming
  const masked = text.replace(/```action-card[\s\S]*?```/g, "_[Spracovávam dáta...]_");
  
  // Also mask any partial/incomplete blocks (still streaming)
  const maskedPartial = masked.replace(/```action-card[\s\S]*$/, "_[Spracovávam dáta...]_");
  
  return maskedPartial;
}

// ═════════════════════════════════════════════════════════════════
// STRICT ENTITY CLASSIFICATION
// ═════════════════════════════════════════════════════════════════

// ABSOLUTE BLACKLIST: These words can NEVER be part of a person's name
const INTENT_WORDS_BLACKLIST = new Set([
  // Intent/Action words
  "prípravky", "príprava", "poistenie", "poistenia", "ponuka", "ponuky",
  "zmluva", "zmluvy", "konzultácia", "konzultácie", "stretnutie", "stretnutia",
  "záujem", "úver", "hypotéka", "hypotéky", "investícia", "investície",
  "daně", "dane", "telefonát", "hovor", "úloha",
  // Generic business words
  "cenová", "cenové", "bytu", "domu", "auta", "spoločnosti", "firma",
  // Time words (should go to date field)
  "zajtra", "pozajtra", "dnes", "pondelok", "utorok", "streda", "štvrtok",
  "piatok", "sobota", "nedeľa", "ráno", "poobede", "večer"
]);

// Common Slovak first names (whitelist for confidence boost)
const COMMON_FIRST_NAMES = new Set([
  "peter", "jana", "michal", "anna", "tomáš", "maria", "marek", "lucia",
  "martin", "katarína", "ján", "eva", "štefan", "monika", "igor", "zuzana",
  "vladimír", "alena", "patrik", "simona", "dušan", "veronika", "branislav",
  "tereza", "roman", "natália", "matúš", "adriana", "filip", "andrea"
]);

// Titles that GUARANTEE the next words are a name
const TITLES = /(?:^|[\s,;])(Ing\.?|ing\.?|Mgr\.?|mgr\.?|Dr\.?|dr\.?|MUDr\.?|mudr\.?|Bc\.?|bc\.?|PhDr\.?|phdr\.?|RNDr\.?|rndr\.?|JUDr\.?|judr\.?|Prof\.?|prof\.?|Doc\.?|doc\.?|pán|pani|pánovi|paní)(?:\s+)/i;

// Check if word could be a person's name component
function isLikelyNameComponent(word: string, allWords: string[], index: number): boolean {
  const lower = word.toLowerCase();
  
  // Must be capitalized
  if (!/^[A-ZÁČŠŽÝÍÉÚÄÔŇ]/.test(word)) return false;
  
  // Cannot be in blacklist
  if (INTENT_WORDS_BLACKLIST.has(lower)) return false;
  
  // Cannot be at sentence start (unless preceded by title)
  if (index === 0) {
    // Check if previous char in original text indicates sentence start
    return false; // First word of sentence is likely not a name
  }
  
  return true;
}

// STRICT NAME EXTRACTION with absolute priority
function extractStrictName(text: string): { 
  name: string; 
  note: string; 
  classified: Array<{ word: string; type: "person" | "intent" | "title" | "other" }>;
  confidence: number;
} {
  const classified: Array<{ word: string; type: "person" | "intent" | "title" | "other" }> = [];
  
  // PRIORITY 1: Title + Name pattern (Ing. Peter Vittek, pán Peter Vittek)
  // This is GUARANTEED name - 100% confidence
  const titleMatch = text.match(/(?:Ing\.?|ing\.?|Mgr\.?|mgr\.?|Dr\.?|dr\.?|MUDr\.?|mudr\.?|Bc\.?|bc\.?|PhDr\.?|RNDr\.?|JUDr\.?|Prof\.?|Doc\.?|pán|pani|pánovi|paní)\s+([A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]+(?:\s+[A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]+){1,2})/i);
  
  if (titleMatch) {
    const namePart = titleMatch[1].trim();
    const words = namePart.split(/\s+/);
    
    // Verify none of the name words are in blacklist
    const isValidName = words.every(w => !INTENT_WORDS_BLACKLIST.has(w.toLowerCase()));
    
    if (isValidName) {
      // Classify all words
      const allWords = text.split(/\s+/);
      for (const w of allWords) {
        const lower = w.toLowerCase().replace(/[.,;!?]$/, "");
        if (w.match(/^(?:Ing\.?|Mgr\.?|Dr\.?|MUDr\.?|Bc\.?|PhDr\.?|RNDr\.?|JUDr\.?|Prof\.?|Doc\.?|pán|pani)/i)) {
          classified.push({ word: w, type: "title" });
        } else if (words.includes(w) || words.includes(w.replace(/[.,;!?]$/, ""))) {
          classified.push({ word: w, type: "person" });
        } else if (INTENT_WORDS_BLACKLIST.has(lower)) {
          classified.push({ word: w, type: "intent" });
        } else {
          classified.push({ word: w, type: "other" });
        }
      }
      
      debugExtraction(text, { name: namePart, note: "", classified, confidence: 100 });
      return { name: namePart, note: "", classified, confidence: 100 };
    }
  }
  
  // PRIORITY 2: Find Capitalized pairs NOT at sentence start, NOT in blacklist
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    
    for (let i = 1; i < words.length - 1; i++) {
      const word1 = words[i].replace(/[.,;!?]$/, "");
      const word2 = words[i + 1]?.replace(/[.,;!?]$/, "");
      
      if (!word2) continue;
      
      // Both must be capitalized
      if (!/^[A-ZÁČŠŽÝÍÉÚÄÔŇ]/.test(word1) || !/^[A-ZÁČŠŽÝÍÉÚÄÔŇ]/.test(word2)) continue;
      
      // Neither can be in blacklist
      if (INTENT_WORDS_BLACKLIST.has(word1.toLowerCase()) || INTENT_WORDS_BLACKLIST.has(word2.toLowerCase())) {
        classified.push({ word: word1, type: "intent" });
        continue;
      }
      
      // Must look like names (2-4 syllables typical for Slovak names)
      const looksLikeName = word1.length >= 3 && word2.length >= 3 && 
                           !INTENT_WORDS_BLACKLIST.has(word1.toLowerCase()) &&
                           !INTENT_WORDS_BLACKLIST.has(word2.toLowerCase());
      
      if (looksLikeName) {
        const name = `${word1} ${word2}`;
        
        // Classify all words in sentence
        for (let j = 0; j < words.length; j++) {
          const w = words[j].replace(/[.,;!?]$/, "");
          const lower = w.toLowerCase();
          
          if (j === i || j === i + 1) {
            classified.push({ word: w, type: "person" });
          } else if (INTENT_WORDS_BLACKLIST.has(lower)) {
            classified.push({ word: w, type: "intent" });
          } else if (w.match(/^(?:Ing|Mgr|Dr|MUDr|Bc|PhDr|RNDr|JUDr|Prof|Doc)/i)) {
            classified.push({ word: w, type: "title" });
          } else {
            classified.push({ word: w, type: "other" });
          }
        }
        
        // Check if first name is common (confidence boost)
        const isCommonName = COMMON_FIRST_NAMES.has(word1.toLowerCase());
        const confidence = isCommonName ? 95 : 75;
        
        debugExtraction(text, { name, note: "", classified, confidence });
        return { name, note: "", classified, confidence };
      }
    }
  }
  
  // PRIORITY 3: Single capitalized word after common patterns like "volá sa", "meno je"
  const patternMatch = text.match(/(?:volá sa|meno je|klient|kontakt|zákazník)\s+([A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]+(?:\s+[A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]+)?)/i);
  if (patternMatch) {
    const candidate = patternMatch[1];
    if (!INTENT_WORDS_BLACKLIST.has(candidate.toLowerCase())) {
      classified.push({ word: candidate, type: "person" });
      debugExtraction(text, { name: candidate, note: "", classified, confidence: 70 });
      return { name: candidate, note: "", classified, confidence: 70 };
    }
  }
  
  // NO ACTION ON JUNK: Return empty if confidence < 90%
  debugExtraction(text, { name: "", note: "", classified, confidence: 0 });
  return { name: "", note: "", classified, confidence: 0 };
}

// ═════════════════════════════════════════════════════════════════
// LEGACY UTILITIES (for compatibility)
// ═════════════════════════════════════════════════════════════════

const TITLES_RE = /(?:pán|pani|pánovi|paní|p\.|ing\.?|mgr\.?|dr\.?|mudr\.?|bc\.?|phdr\.?|rndr\.?|judr\.?|prof\.?|doc\.?)\s*/gi;
const BAD_NAME = /^(pán\s*name|pani\s*name|name|n\/a|undefined|null|unknown|neznámy|neznáma|-)$/i;
const NOT_A_NAME = /^(?:Zajtra|Dnes|Prosím|Ahoj|Dobrý|Dobrá|Dobré|Vedomosti|Konzultácia|Príprava|Záujem|Stretnutie|Telefonát|Neural|Unifyo)$/i;

function cleanName(raw: string): string {
  return raw.replace(TITLES_RE, "").trim();
}

function isValidName(s: string): boolean {
  if (!s || BAD_NAME.test(s.trim())) return false;
  return /[A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]{1,}/.test(s);
}

// Fabricated values that the LLM keeps echoing from prompt examples or
// its training data. We strip these BEFORE the card reaches the UI so
// the user never sees a wizard pre-filled with fake `+421 900 000 000`
// or `peter@firma.sk`. The model is *told* not to fabricate, but model
// adherence isn't 100% — server-side belt is required.
const FABRICATED_PATTERNS: RegExp[] = [
  // Phones with all-zero or all-same trailing digits
  /^\+?\s*4?2?1?\s*9?\d?\d?\s*0{3}\s*0{3}\s*0{3}$/i,         // +421 900 000 000 / 421 9XX 000 000
  /^\+?\s*\d[\d\s]*?(\d)\1{4,}\s*$/,                          // run of 5+ same digits
  /^\+?\s*0{6,}/,                                              // leading 0000000
  // Stock placeholder emails
  /@(firma|email|test|example|domena|placeholder)\.(sk|cz|com|eu)$/i,
  /^(test|placeholder|priklad|example|firma|info)@/i,
  // Stock placeholder companies (Greek-letter / Test s.r.o.)
  /^(Alfa|Beta|Gamma|Delta|Test|Vzor|Príklad|Firma\s+XYZ)\s+s\.?\s*r\.?\s*o\.?$/i,
  /^(Firma|Spoločnosť)\s+[A-Z]\.?$/i,
];

function isFabricated(val: string): boolean {
  const s = val.trim();
  if (!s) return false;
  return FABRICATED_PATTERNS.some((re) => re.test(s));
}

function sanitiseFields(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    let val = String(v ?? "").trim();
    if (k === "Meno") {
      val = cleanName(val);
      out[k] = isValidName(val) ? val : "";
    } else if (k === "Email" || k === "Telefón" || k === "Firma") {
      // Drop fabricated contact details before they reach the UI.
      if (isFabricated(val)) val = "";
      out[k] = BAD_NAME.test(val) ? "" : val;
    } else {
      out[k] = BAD_NAME.test(val) ? "" : val;
    }
  }
  return out;
}

const SK_CAPS_NAME = /(?:^|[\s,;])([A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]{1,20}(?:\s+[A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôň]{1,20}){1,3})(?=[\s,;.!?]|$)/gm;

function scanNameFromText(text: string): string {
  SK_CAPS_NAME.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SK_CAPS_NAME.exec(text)) !== null) {
    const candidate = cleanName(m[1].trim());
    if (isValidName(candidate) && !NOT_A_NAME.test(candidate.split(" ")[0])) {
      return candidate;
    }
  }
  return "";
}

// ═════════════════════════════════════════════════════════════════
// CRM UTILITIES — Category, Email validation, Phone normalization
// ═════════════════════════════════════════════════════════════════

type Category = "Hypo" | "Poistenie" | "Investície" | "Iné";

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: Category }> = [
  { pattern: /hypo(téku?|téky)?|hypotekárny|úver\s+na\s+byt/i, category: "Hypo" },
  { pattern: /poisteni[ea]|poistiť|poistná|poistný/i, category: "Poistenie" },
  { pattern: /invest(ici[ae]|ovať|ovanie)|fondy|cenné\s+papier/i, category: "Investície" },
];

function assignCategory(text: string): Category {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return "Iné";
}

function validateEmail(email: string): { valid: boolean; normalized: string } {
  const trimmed = email.trim().toLowerCase();
  const emailRe = /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/;
  return {
    valid: emailRe.test(trimmed),
    normalized: trimmed
  };
}

function normalizePhone(phone: string): { valid: boolean; normalized: string } {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  
  // Slovak phone patterns: +421 XXX XXX XXX or 0XXX XXX XXX
  const skPattern = /^(?:\+421|0)(\d{9})$/;
  const match = cleaned.match(skPattern);
  
  if (match) {
    return {
      valid: true,
      normalized: `+421${match[1]}`
    };
  }
  
  // Generic validation: at least 9 digits
  const digitsOnly = cleaned.replace(/\D/g, "");
  return {
    valid: digitsOnly.length >= 9,
    normalized: cleaned
  };
}

// Extract intent/note from text
function extractNote(text: string): string {
  const patterns = [
    /(?:chce|chceme|potrebuje|potrebujú|záujem o)\s+(.{3,60}?)(?:\.|,|$)/i,
    /(?:príprava|pripraviť)\s+(.{3,60}?)(?:\.|,|$)/i,
    /(?:poistenie)\s+(.{3,40}?)(?:\.|,|$)/i,
    /(?:cenová ponuka|cenovú ponuku)\s+(.{3,40}?)(?:\.|,|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return capitalise(match[1].trim());
    }
  }
  
  return "";
}

// ─────────────────────────────────────────────────────────────────
// INTENT MAP
// ─────────────────────────────────────────────────────────────────
const INTENT_MAP: Array<{ pattern: RegExp; note: string; taskTitle: string }> = [
  { pattern: /hypo(téku?|téky)?/i,           note: "Záujem o hypotéku",          taskTitle: "Konzultácia: Hypotéka"   },
  { pattern: /poisteni[ea]/i,                 note: "Záujem o poistenie",         taskTitle: "Konzultácia: Poistenie"  },
  { pattern: /poisteni[ea]\s+bytu/i,          note: "Záujem o poistenie bytu",    taskTitle: "Konzultácia: Poistenie bytu" },
  { pattern: /cenov[aá]\s+ponuk[ua]/i,        note: "Záujem o cenovú ponuku",     taskTitle: "Príprava cenovej ponuky" },
  { pattern: /ponuk[ua]/i,                    note: "Záujem o ponuku",            taskTitle: "Príprava ponuky"         },
  { pattern: /zmluv[ua]/i,                    note: "Riešenie zmluvy",            taskTitle: "Príprava zmluvy"         },
  { pattern: /invest(ici[ae]|ova)/i,          note: "Záujem o investíciu",        taskTitle: "Konzultácia: Investície" },
  { pattern: /úver/i,                         note: "Záujem o úver",              taskTitle: "Konzultácia: Úver"       },
  { pattern: /da[ňn]ov[eé]/i,                 note: "Daňové poradenstvo",         taskTitle: "Konzultácia: Dane"       },
  { pattern: /chce\s+riešiť\s+(.{3,40})/i,   note: "",                           taskTitle: "Konzultácia"             },
];

function resolveIntent(text: string): { note: string; taskTitle: string } | null {
  // Sort longer patterns first to catch "poistenie bytu" before "poistenie"
  for (const entry of INTENT_MAP) {
    const re = new RegExp(entry.pattern.source, entry.pattern.flags);
    const m = re.exec(text);
    if (m) {
      const note = entry.note || (m[1] ? `Záujem o ${m[1].trim()}` : "");
      return { note, taskTitle: entry.taskTitle };
    }
  }
  return null;
}

// Build a human-readable note from the full user sentence (for Poznámka field)
function buildNoteFromText(text: string): string {
  // Extract the substantive intent phrase — everything after "chce" / "záujem" / "potrebuje"
  const m = /(?:chce|záujem o|potrebuje|riešiť|dohodli sme sa na)\s+(.{5,80}?)(?:\.|,|$)/i.exec(text);
  return m ? capitalise(m[1].trim()) : "";
}

// ─────────────────────────────────────────────────────────────────
// DATE EXTRACTION AND NORMALIZATION
// Converts relative dates to absolute YYYY-MM-DD format
// ─────────────────────────────────────────────────────────────────
const RELATIVE_DATE_RE = /(?:v\s+)?(pondelok|utorok|stredu|štvrtok|piatok|sobotu|nedeľu|zajtra|pozajtra|dnes)/i;
const ABSOLUTE_DATE_RE = /(\d{1,2})\.\s*(\d{1,2})\.?(?:\s*(\d{2,4}))?/;

function getNextWeekday(targetDay: number): Date {
  const days = ['nedeľu', 'pondelok', 'utorok', 'stredu', 'štvrtok', 'piatok', 'sobotu'];
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const result = new Date(now);
  result.setDate(now.getDate() + daysUntil);
  return result;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function normalizeDate(text: string): { raw: string; normalized: string } {
  // Check for relative dates first
  const relativeMatch = RELATIVE_DATE_RE.exec(text);
  if (relativeMatch) {
    const raw = relativeMatch[1].toLowerCase();
    let targetDate: Date | null = null;
    
    switch (raw) {
      case 'zajtra':
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 1);
        break;
      case 'pozajtra':
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 2);
        break;
      case 'dnes':
        targetDate = new Date();
        break;
      case 'pondelok':
        targetDate = getNextWeekday(1);
        break;
      case 'utorok':
        targetDate = getNextWeekday(2);
        break;
      case 'stredu':
        targetDate = getNextWeekday(3);
        break;
      case 'štvrtok':
        targetDate = getNextWeekday(4);
        break;
      case 'piatok':
        targetDate = getNextWeekday(5);
        break;
      case 'sobotu':
        targetDate = getNextWeekday(6);
        break;
      case 'nedeľu':
        targetDate = getNextWeekday(0);
        break;
    }
    
    if (targetDate) {
      return { raw: relativeMatch[0], normalized: formatDateISO(targetDate) };
    }
  }
  
  // Check for absolute dates (DD. MM. or DD. MM. YYYY)
  const absoluteMatch = ABSOLUTE_DATE_RE.exec(text);
  if (absoluteMatch) {
    const day = parseInt(absoluteMatch[1], 10);
    const month = parseInt(absoluteMatch[2], 10) - 1; // 0-indexed
    let year = absoluteMatch[3] ? parseInt(absoluteMatch[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000; // Convert 25 -> 2025
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return { raw: absoluteMatch[0], normalized: formatDateISO(date) };
    }
  }
  
  return { raw: "", normalized: "" };
}

// ─────────────────────────────────────────────────────────────────
// AI-BLOCK PARSER — parse ```action-card blocks
// ─────────────────────────────────────────────────────────────────
// Try to repair common AI malformations before JSON.parse:
//  - Missing "type" key:      `{"":"contact",...}`      -> `{"type":"contact",...}`
//  - Merged "fields"+first:   `{"fieldsÚloha":"x",...}` -> `{"fields":{"Úloha":"x",...}}`
//  - Missing closing braces on trailing blocks
function repairActionCardJson(raw: string): string {
  let s = raw;
  // 1) Missing "type" key → heuristic: first empty key with "contact"/"task"/"company" value
  s = s.replace(/"":\s*"(contact|task|company|event|deal)"/g, '"type":"$1"');
  // 2) "fields" merged with first inner key: fieldsÚloha, fieldsMeno, fieldsFirma, fieldsEmail…
  s = s.replace(/"fields([A-ZÁČŠŽÝÍÉÚÄÔŇ][a-záčšžýíéúäôňá-ž]+)"\s*:\s*"([^"]*)"/g,
    (_match, firstKey: string, firstVal: string) => `"fields":{"${firstKey}":"${firstVal}"`);
  // 3) Trailing unbalanced braces — count and add missing ones
  const opens = (s.match(/\{/g) ?? []).length;
  const closes = (s.match(/\}/g) ?? []).length;
  if (opens > closes) s = s + "}".repeat(opens - closes);
  return s;
}

function parseActionCardBlocks(text: string): ActionCard[] {
  const cards: ActionCard[] = [];
  const blockRe = /```action-card\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const raw = m[1].trim();
    let parsed: { type?: string; fields?: Record<string, string> } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Attempt repair pass — AI sometimes emits malformed keys during streaming
      try { parsed = JSON.parse(repairActionCardJson(raw)); } catch { continue; }
    }
    if (!parsed || typeof parsed !== "object") continue;
    const type = (
      parsed.type === "task" ? "task" :
      parsed.type === "company" ? "company" :
      parsed.type === "deal" ? "deal" : "contact"
    ) as ActionCardType;
    const fields = sanitiseFields(parsed.fields ?? {});

    // FORCE NAME EXTRACTION: "Vittek Test"
    // If Meno is empty for a contact/company card, FORCE strict extraction from raw text.
    // Deals don't have Meno — they have Názov — so skip this for them.
    let extractionDebug: ExtractionDebug | undefined;
    if (type !== "task" && type !== "deal" && !fields["Meno"]) {
      const { name: forcedName, classified, confidence } = extractStrictName(text);
      if (forcedName) fields["Meno"] = forcedName;
      extractionDebug = { classifiedWords: classified, chosenName: forcedName, confidence };
    }

    // Normalize dates in task cards
    if (type === "task" && fields["Dátum"]) {
      const dateInfo = normalizeDate(fields["Dátum"]);
      if (dateInfo.normalized) {
        fields["Dátum"] = dateInfo.normalized;
      }
    }

    // Validate before adding
    const card: ActionCard = {
      id: uid(),
      type,
      status: "pending",
      fields,
      targetModule: type === "task" ? "calendar" : "crm",
      rawText: text,
      extractionDebug
    };
    const validated = validateCard(card);
    
    // Don't skip cards with missing fields — show them with warning
    cards.push(validated);
  }
  return cards;
}

// ─────────────────────────────────────────────────────────────────
// REGEX FALLBACK — Multi-Entity Stack with Strict Name Priority
// ─────────────────────────────────────────────────────────────────

function forceEntityExtraction(text: string): { name: string; note: string; confidence: number } {
  // USE STRICT EXTRACTION with 100% priority on names after titles
  const result = extractStrictName(text);
  
  // Build note from intent extraction
  const note = extractNote(text) || "";
  
  return { name: result.name, note, confidence: result.confidence };
}

// ─────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────
export function validateCard(card: ActionCard): ActionCard {
  const missing: string[] = [];
  
  if (card.type === "contact" || card.type === "company") {
    if (!card.fields["Meno"]?.trim() && !card.fields["Firma"]?.trim()) {
      missing.push("Meno");
    }
  }
  
  if (card.type === "task") {
    if (!card.fields["Úloha"]?.trim()) {
      missing.push("Úloha");
    }
  }

  if (card.type === "deal") {
    if (!card.fields["Názov"]?.trim()) {
      missing.push("Názov");
    }
  }
  
  return { ...card, missingRequiredFields: missing };
}

export function hasMissingRequiredFields(card: ActionCard): boolean {
  return (card.missingRequiredFields?.length ?? 0) > 0;
}

function regexFallback(text: string): ActionCard[] {
  const cards: ActionCard[] = [];

  const emails  = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) ?? [];
  const phones  = text.match(/(?:\+421|0)[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}/g) ?? [];
  const intent  = resolveIntent(text);
  const dateInfo = normalizeDate(text);

  // FORCE entity extraction — "Vittek Test"
  const { name: contactName, note: extractedNote, confidence } = forceEntityExtraction(text);
  
  // Visual debug for regex fallback
  if (DEBUG_ENABLED && contactName) {
    console.log("🎯 REGEX FALLBACK: Found name =", contactName, "(confidence:", confidence + "%)");
  }

  const hasTaskKw = /(?:zaplánuj|pripomeň|stretnutie|hovor|volanie|úloha|zavolaj|pošli|pozvi)/i.test(text);
  const hasDate   = dateInfo.normalized !== "" || dateInfo.raw !== "";
  const hasIntent = intent !== null;
  const hasPersonSignal = contactName || emails.length > 0;

  // ── CRM card ──────────────────────────────────────────────────
  // ALWAYS create CRM card if we have any person signal
  if (hasPersonSignal) {
    const fields: Record<string, string> = {};
    if (contactName)  fields["Meno"]    = contactName;
    if (emails[0])    fields["Email"]   = emails[0];
    if (phones[0])    fields["Telefón"] = phones[0].replace(/\s/g, "");
    
    // Poznámka = intent note OR extracted note — NEVER just the name
    if (intent?.note) {
      fields["Poznámka"] = intent.note;
    } else if (extractedNote) {
      fields["Poznámka"] = extractedNote;
    }
    
    const card: ActionCard = { 
      id: uid(), 
      type: "contact", 
      status: "pending", 
      fields, 
      targetModule: "crm", 
      rawText: text,
      extractionDebug: { classifiedWords: [], chosenName: contactName, confidence }
    };
    cards.push(validateCard(card));
  }

  // ── Company (only if no personal contact) ─────────────────────
  if (!contactName) {
    const companyPatterns = [
      /(?:firma|spoločnosť|zo\s+spoločnosti|pre\s+firmu)\s+([A-ZÁČŠŽÝÍÉÚÄÔŇ][^\s,]{1,40}(?:\s+[^\s,]{1,40})?)/i,
      /([A-Z][a-zA-Z]{2,}\s+(?:s\.r\.o\.|a\.s\.|s\.p\.|GmbH|Ltd\.|Inc\.))/,
    ];
    for (const re of companyPatterns) {
      const m = re.exec(text);
      if (m) {
        const card: ActionCard = {
          id: uid(),
          type: "company",
          status: "pending",
          fields: { "Firma": m[1].trim() },
          targetModule: "crm",
          rawText: text,
          extractionDebug: { classifiedWords: [], chosenName: m[1].trim(), confidence: 100 }
        };
        cards.push(validateCard(card));
        break;
      }
    }
  }

  // ── Calendar card ─────────────────────────────────────────────
  // Vytvor iba keď je EXPLICITNÝ signál plánovania. Predtým sa tvorila
  // aj z holého "hasPersonSignal" alebo "hasIntent" ("poistenie"), čo
  // generovalo ghost stretnutia pri obyčajnej zmienke osoby.
  const hasTimeKw = /\b\d{1,2}:\d{2}\b/.test(text);
  const shouldCreateCalendar = hasTaskKw || hasDate || hasTimeKw;
  void hasIntent; // (ponecháné, aby neostala warning o unused)
  
  if (shouldCreateCalendar) {
    const fields: Record<string, string> = {};

    if (intent?.taskTitle) {
      fields["Úloha"] = intent.taskTitle;
    } else if (hasTaskKw) {
      const m = /(?:zaplánuj|pripomeň|stretnutie|hovor|zavolaj|pošli)\s+(.{3,60}?)(?:\.|,|\n|$)/i.exec(text);
      if (m) fields["Úloha"] = capitalise(m[1].trim());
    }

    if (!fields["Úloha"] && contactName) fields["Úloha"] = `Stretnutie: ${contactName}`;
    if (!fields["Úloha"]) fields["Úloha"] = intent?.taskTitle || "Konzultácia";

    // Poznámka in task = name only (for CRM link reference)
    if (contactName) fields["Poznámka"] = contactName;

    // Use normalized date (YYYY-MM-DD) if available, otherwise raw
    if (dateInfo.normalized) {
      fields["Dátum"] = dateInfo.normalized;
    } else if (dateInfo.raw) {
      fields["Dátum"] = dateInfo.raw;
    }

    const card: ActionCard = {
      id: uid(),
      type: "task",
      status: "pending",
      fields,
      targetModule: "calendar",
      rawText: text,
      extractionDebug: { classifiedWords: [], chosenName: contactName, confidence: 100 }
    };
    cards.push(validateCard(card));
  }

  return cards;
}

// ═════════════════════════════════════════════════════════════════
// ARCHITECTURE OF SENSES — Core Identity Logic
// ═════════════════════════════════════════════════════════════════
// Hierarchy: 1. KTO (Person) → 2. ČO (Intent) → 3. KEDY (Time)
// Rule: If person detected → CRM card is MANDATORY
// Rule: If intent/time detected → Calendar card is MANDATORY
// Rule: Dual-extraction = ALWAYS both cards when Person + Intent + Date present

// Detect "advisory" messages — user is asking for advice, not commanding
// a save. For these we MUST NOT greedily auto-generate Sprievodca cards,
// lebo to potom vyzerá že AI si vymýšľa termíny a kontakty ktoré user
// nežiadal ("Stretnutie: Následný · ne 19. 4." pri otázke "čo s tým").
// AI stále môže explicitne vygenerovať action-card bloky keď user
// potvrdí — tieto prejdú cez parseActionCardBlocks a obídu túto bránu.
function isAdvisoryQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.length === 0) return false;
  // Otáznik kdekoľvek
  if (/\?/.test(t)) return true;
  // Začiatok vety s otáznym slovom
  if (/^(?:čo|ako|kedy|prečo|kde|kto|ktorý|ktorá|mal by|mala by|mám|oplatí|dá sa|vieš|vies|povedz|poraď|pomôž|pomoz)\b/i.test(t)) return true;
  // Poradenské frázy
  if (/(?:\bčo s tým\b|\bco s tym\b|\bčo robiť\b|\bco robit\b|\bporaď\b|\bporad\b|\bpomôž\b|\bpomoz\b|\bneviem čo\b|\bneviem co\b|\bčo myslíš\b|\bco myslis\b|\bčo navrhuješ\b|\bco navrhujes\b|\bčo by si\b|\bco by si\b|\bako riešiť\b|\bako riesit\b|\bmal sa rozm|\bmala sa rozm)/i.test(t)) return true;
  return false;
}

export function extractActionCards(text: string): ActionCard[] {
  // Run AI parser first — explicitné ```action-card``` bloky od AI sú
  // vždy rešpektované, aj pri advisory messages.
  const aiCards = parseActionCardBlocks(text);

  // ADVISORY GATE: ak user kladie otázku a AI explicitne nevygenerovala
  // žiadne action-card bloky, NIČ nevytváraj automaticky. Inak by sa pri
  // otázke typu "klient váha s poistením, čo s tým?" objavili ghost karty
  // s vymysleným dátumom/časom.
  if (aiCards.length === 0 && isAdvisoryQuestion(text)) {
    return [];
  }

  // EMAIL-INTENT GATE: "napíš e-mail / navrhni email / follow-up /
  // pošli mu / reply". Email drafts aren't contacts and aren't
  // calendar entries — they get their own CTA (EmailDraftCTA in
  // DashboardClient). Surfacing a GuidedCard here confuses the user
  // ("prečo chce odo mňa meno, ja ho chcem iba poslať?").
  const isEmailIntent = /\b(email|e-?mail|mail|sprava|správa|napíš|navrhni|draft|follow[\s-]?up|odpove[ďz]|pošli[\s](?:mu|jej|e-?mail|mail|správu))\b/i.test(text);
  if (aiCards.length === 0 && isEmailIntent) {
    return [];
  }

  // Detect entities in raw text using fallback analysis
  const { name: contactName, confidence } = forceEntityExtraction(text);
  const dateInfo = normalizeDate(text);
  const intent = resolveIntent(text);
  const hasTaskKw = /(?:zaplánuj|pripomeň|stretnutie|hovor|volanie|úloha|zavolaj|pošli|pozvi|naplánuj)/i.test(text);
  const hasTimeKw = /\b\d{1,2}:\d{2}\b/.test(text);
  const hasDate = dateInfo.normalized !== "" || dateInfo.raw !== "";
  // Calendar card vyžaduje EXPLICITNÝ signál plánovania — dátum, čas, alebo
  // task keyword. Samotná zmienka "poistenie" (intent keyword) NEMÁ
  // stačiť, inak sa pri každej vete o poistení vytvorí fake stretnutie.
  const hasExplicitSchedule = hasDate || hasTimeKw || hasTaskKw;
  // Explicit add-contact commands ("pridaj kontakt …", "ulož kontakt …")
  // bypass the confidence threshold — the user's intent is unambiguous.
  // Without this, "Pridaj kontakt Peter Novák, tel 0950…" would need a
  // 90%+ match and often fall through, leaving the user's command
  // silently unprocessed.
  const isExplicitAddContact = /\b(prida[jť]|ulož|zaznam(enaj)?|uložiť|nastav)\s+(?:kontakt|klienta|osobu)\b/i.test(text);
  const hasPerson = contactName && (confidence >= 90 || (isExplicitAddContact && confidence >= 40));

  // Architecture Check: Do we have both cards when we should?
  const hasCRM = aiCards.some(c => c.targetModule === "crm");
  const hasCalendar = aiCards.some(c => c.targetModule === "calendar");

  const result: ActionCard[] = [...aiCards];
  
  // MANDATORY CRM: If person exists but no CRM card, create one
  if (hasPerson && !hasCRM) {
    const emails = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) ?? [];
    const phones = text.match(/(?:\+421|0)[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}/g) ?? [];
    
    const crmFields: Record<string, string> = { "Meno": contactName };
    
    // Email validation and normalization
    if (emails[0]) {
      const emailCheck = validateEmail(emails[0]);
      if (emailCheck.valid) crmFields["Email"] = emailCheck.normalized;
    }
    
    // Phone normalization to international format
    if (phones[0]) {
      const phoneCheck = normalizePhone(phones[0]);
      if (phoneCheck.valid) crmFields["Telefón"] = phoneCheck.normalized;
    }
    
    // Poznámka = full business intent, not just name
    const note = intent?.note || extractNote(text) || "";
    if (note) crmFields["Poznámka"] = note;
    
    // Kategória = automatic assignment based on keywords
    crmFields["Kategória"] = assignCategory(text);
    
    const crmCard: ActionCard = {
      id: uid(),
      type: "contact",
      status: "pending",
      fields: crmFields,
      targetModule: "crm",
      rawText: text,
      extractionDebug: { classifiedWords: [], chosenName: contactName, confidence }
    };
    result.push(validateCard(crmCard));
  }
  
  // CALENDAR: iba keď je EXPLICITNÝ signál plánovania (dátum, čas, alebo
  // task keyword). Predtým sa vytvárala aj keď user iba spomenul "poistenie"
  // — to vygenerovalo ghost "Konzultácia: Poistenie · 10:00" pri otázkach.
  if (hasExplicitSchedule && !hasCalendar) {
    const calFields: Record<string, string> = {};
    
    // Úloha title from intent or default
    if (intent?.taskTitle) {
      calFields["Úloha"] = intent.taskTitle;
    } else if (hasTaskKw) {
      const m = /(?:zaplánuj|pripomeň|stretnutie|hovor|zavolaj|pošli)\s+(.{3,60}?)(?:\.|,|\n|$)/i.exec(text);
      if (m) calFields["Úloha"] = capitalise(m[1].trim());
    }
    
    // Default: "Následný kontakt" if no specific task
    if (!calFields["Úloha"]) {
      calFields["Úloha"] = hasPerson ? `Následný kontakt: ${contactName}` : "Následný kontakt";
    }
    
    // Link to person if available
    if (contactName) calFields["Poznámka"] = contactName;
    
    // Date: normalized YYYY-MM-DD or raw
    if (dateInfo.normalized) {
      calFields["Dátum"] = dateInfo.normalized;
    } else if (dateInfo.raw) {
      calFields["Dátum"] = dateInfo.raw;
    }
    
    // Čas: extract from text ONLY. NIKDY nedefaultuj — prázdne pole user
    // doplní v karte (a confirm-first flow sa ho spýta pri potvrdení).
    // Predtým tu bol default "10:00" — halucinoval čas ktorý user nikdy
    // nenapísal, čo vyzeralo ako keby AI vymýšľala fakty.
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      calFields["Čas"] = `${String(parseInt(timeMatch[1])).padStart(2, '0')}:${timeMatch[2]}`;
    } else {
      calFields["Čas"] = "";
    }
    
    const calCard: ActionCard = {
      id: uid(),
      type: "task",
      status: "pending",
      fields: calFields,
      targetModule: "calendar",
      rawText: text,
      extractionDebug: { classifiedWords: [], chosenName: contactName, confidence: 100 }
    };
    result.push(validateCard(calCard));
  }
  
  // If no AI cards and no forced cards, use full regex fallback
  if (result.length === 0) {
    return regexFallback(text);
  }
  
  return result;
}

// Contextual Glue: standalone email/phone → merge into existing pending card
export function detectContextualUpdate(text: string): { field: string; value: string } | null {
  // Try email first
  const emailMatch = text.match(/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i);
  if (emailMatch) {
    const emailCheck = validateEmail(emailMatch[0]);
    if (emailCheck.valid) return { field: "Email", value: emailCheck.normalized };
  }
  
  // Then try phone
  const phoneMatch = text.match(/^(?:\+421|0)[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$/);
  if (phoneMatch) {
    const phoneCheck = normalizePhone(phoneMatch[0]);
    if (phoneCheck.valid) return { field: "Telefón", value: phoneCheck.normalized };
  }
  
  return null;
}

// ═════════════════════════════════════════════════════════════════
// EMAIL DRAFT GENERATION
// ═════════════════════════════════════════════════════════════════

export interface EmailDraftParams {
  recipientName: string;
  recipientEmail?: string;
  context: string;
  intent: "hypo" | "poistenie" | "investicie" | "default";
  proposedDate?: string;
  proposedTime?: string;
}

export async function generateEmailDraft(params: EmailDraftParams): Promise<{
  subject: string;
  body: string;
  recipient: { name: string; email?: string };
}> {
  const res = await fetch("/api/email/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!res.ok) {
    throw new Error("Failed to generate email draft");
  }
  
  return res.json();
}

// Export new utilities for use in UI components
export { assignCategory, validateEmail, normalizePhone, normalizeDate, type Category };
