import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

// Email draft generation based on context
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, config.security.rateLimit.ai, "email-draft");
  if (limited) return limited;

  const { session, response: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { 
      recipientName, 
      recipientEmail, 
      context, 
      intent, 
      proposedDate, 
      proposedTime,
      tone = "professional" 
    } = await req.json();

    if (!recipientName || !context) {
      return NextResponse.json({ error: "Chýba meno príjemcu alebo kontext" }, { status: 400 });
    }

    // Generate professional subject line
    const subjects: Record<string, string[]> = {
      hypo: [
        `Konzultácia: Hypotekárne riešenie - ${recipientName}`,
        `Návrh hypotekárneho financovania`,
        `Follow-up: Vaša požiadavka na hypo`,
      ],
      poistenie: [
        `Konzultácia: Poistné riešenie - ${recipientName}`,
        `Návrh poistenia na mieru`,
        `Follow-up: Poistná ponuka`,
      ],
      investicie: [
        `Konzultácia: Investičné príležitosti`,
        `Návrh investičného portfólia`,
        `Follow-up: Vaše investičné ciele`,
      ],
      default: [
        `Konzultácia - ${recipientName}`,
        `Follow-up: Naša predchádzajúca komunikácia`,
        `Doplnenie informácií`,
      ],
    };

    const subjectPool = subjects[intent as keyof typeof subjects] || subjects.default;
    const subject = subjectPool[Math.floor(Math.random() * subjectPool.length)];

    // Generate email body
    const greetings = [
      `Dobrý deň, pán ${recipientName.split(' ').pop()}`,
      `Dobrý deň, ${recipientName}`,
      `Dobrý deň`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    const closings = [
      "S pozdravom",
      "S úctou",
      "Hezký deň praje",
    ];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    // Build the meeting proposal if date/time provided
    let meetingProposal = "";
    if (proposedDate && proposedTime) {
      const dateFormatted = new Date(proposedDate).toLocaleDateString('sk-SK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      meetingProposal = `\n\nNavrhovaný termín konzultácie:\n${dateFormatted} o ${proposedTime}\n\nAk vám tento termín nevyhovuje, navrhnite prosím alternatívny.\n`;
    }

    // Context-specific body content
    const contextBodies: Record<string, string> = {
      hypo: `ďakujeme za prejavený záujem o hypotekárne riešenie. Pripravili sme pre vás predbežnú analýzu možností financovania na základe našej predchádzajúcej komunikácie.\n\nV nasledujúcom kroku by sme radi prešli detaily vašej situácie a predstavili konkrétne produkty, ktoré by vám najlepšie vyhovovali.${meetingProposal}\nTešíme sa na spoluprácu.`,
      poistenie: `ďakujeme za prejavený záujem o poistné riešenie. Analyzovali sme vaše požiadavky a pripravili sme návrh poistenia na mieru vašim potrebám.\n\nV nasledujúcom kroku by sme radi prešli detaily jednotlivých poistných produktov a upresnili rozsah krytia.${meetingProposal}\nTešíme sa na spoluprácu.`,
      investicie: `ďakujeme za prejavený záujem o investičné riešenie. Na základe vašich cieľov a časového horizontu sme pripravili predbežný návrh investičného portfólia.\n\nV nasledujúcom kroku by sme radi prešli detailnú analýzu a prispôsobili strategiu vašim preferenciám rizika.${meetingProposal}\nTešíme sa na spoluprácu.`,
      default: `ďakujeme za našu predchádzajúcu komunikáciu. Na základe vašich požiadaviek sme pripravili návrh riešenia.\n\nRadi by sme prešli detaily a odpovedali na všetky vaše otázky.${meetingProposal}\nTešíme sa na spoluprácu.`,
    };

    const bodyContent = contextBodies[intent as keyof typeof contextBodies] || contextBodies.default;

    const body = `${greeting},\n\n${bodyContent}\n\n${closing},\nVáš finančný poradca`;

    return NextResponse.json({
      subject,
      body,
      recipient: {
        name: recipientName,
        email: recipientEmail,
      },
      metadata: {
        intent,
        proposedDate,
        proposedTime,
      },
    });

  } catch {
    return NextResponse.json({ error: "Nepodarilo sa vygenerovať email" }, { status: 500 });
  }
}
