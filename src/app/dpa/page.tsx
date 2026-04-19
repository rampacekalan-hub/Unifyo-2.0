import LegalLayout from "@/components/layout/LegalLayout";

// src/app/dpa/page.tsx
// Data Processing Agreement (GDPR Art. 28) — zmluva medzi zákazníkom (B2B
// prevádzkovateľ) a Unifyo (sprostredkovateľ). Keď B2B klient ukladá do
// Unifyo osobné údaje svojich zákazníkov/kontaktov/zamestnancov, vzniká
// sprostredkovateľský vzťah ktorý Art. 28 GDPR vyžaduje mať písomne.
//
// Dokument je zámerne štruktúrovaný ako verejná ponuka — akceptáciou ToS
// sa automaticky akceptuje aj táto DPA (pokiaľ zákazník spracúva osobné
// údaje tretích osôb). Pre enterprise klientov je možné uzavrieť písomný
// dodatok (info@unifyo.online).

export const metadata = {
  title: "Zmluva o spracúvaní údajov (DPA) | Unifyo",
  description:
    "Data Processing Agreement podľa čl. 28 GDPR medzi zákazníkom (prevádzkovateľ) a ALAN RAMPÁČEK s. r. o. (sprostredkovateľ).",
};

export default function DpaPage() {
  return (
    <LegalLayout
      badge="GDPR Art. 28 — DPA"
      title="Zmluva o spracúvaní osobných údajov"
      subtitle="Data Processing Agreement (DPA) podľa čl. 28 Nariadenia (EÚ) 2016/679 — uzatvorená medzi zákazníkom (prevádzkovateľ) a spoločnosťou ALAN RAMPÁČEK s. r. o. (sprostredkovateľ)."
      lastUpdated="19. apríla 2026"
      sections={[
        {
          title: "1. Zmluvné strany a účel",
          content: [
            "Prevádzkovateľ: registrovaný zákazník platformy Unifyo — fyzická alebo právnická osoba, ktorá určuje účely a prostriedky spracúvania osobných údajov tretích osôb (svojich zákazníkov, zamestnancov, kontaktov) a vkladá ich do platformy Unifyo.",
            "Sprostredkovateľ: ALAN RAMPÁČEK s. r. o., IČO: 56 908 377, so sídlom Námestie Martina Benku 6302/10, 811 07 Bratislava, zapísaná v OR Mestského súdu Bratislava III, odd. Sro, vl. č. 187159/B (ďalej len „Unifyo“).",
            "Predmetom tejto DPA je úprava vzťahov pri spracúvaní osobných údajov, ktoré prevádzkovateľ ukladá, prenáša alebo inak spracúva prostredníctvom platformy Unifyo (unifyo.online).",
            "Táto DPA sa stáva záväznou okamihom, keď prevádzkovateľ akceptuje Všeobecné obchodné podmienky Unifyo (/podmienky) a vytvorí v platforme prvý záznam obsahujúci osobné údaje tretích osôb.",
          ],
        },
        {
          title: "2. Povaha a účel spracúvania",
          content: [
            "Účel: poskytovanie funkcionality platformy Unifyo — CRM, kalendár, AI asistent, neurálna pamäť, komunikačné nástroje — v rozsahu definovanom v zvolenom cenovom pláne.",
            "Povaha spracúvania: ukladanie, štruktúrované vyhľadávanie, AI-asistované sumarizovanie, export, mazanie. Žiadne automatizované rozhodovanie s právnymi účinkami podľa čl. 22 GDPR.",
            "Doba spracúvania: počas trvania zmluvného vzťahu s prevádzkovateľom a 30 dní po jeho ukončení (na účel umožnenia exportu dát), následne sú údaje trvalo vymazané.",
          ],
        },
        {
          title: "3. Typy osobných údajov a kategórie dotknutých osôb",
          content: [
            "Typy údajov, ktoré platforma prijíma: identifikačné a kontaktné údaje (meno, email, telefón, spoločnosť), obsah poznámok, správ a kalendárnych úloh zadaný prevádzkovateľom, metaúdaje (časové pečiatky, audit log).",
            "Kategórie dotknutých osôb: zákazníci prevádzkovateľa, jeho kontakty, zamestnanci, dodávatelia — v rozsahu, v akom ich prevádzkovateľ do platformy vloží.",
            "Prevádzkovateľ zodpovedá za to, že do platformy nevkladá osobitné kategórie údajov podľa čl. 9 GDPR (zdravotné údaje, politické názory, genetické údaje a pod.) bez predchádzajúceho písomného súhlasu Unifyo a bez primeraného právneho základu.",
          ],
        },
        {
          title: "4. Povinnosti sprostredkovateľa (Unifyo)",
          content: [
            "Spracúva osobné údaje výlučne na základe zdokumentovaných pokynov prevádzkovateľa (technické pokyny vyjadrené používaním platformy sú za takéto pokyny považované), s výnimkou prípadov, keď to vyžaduje právo EÚ alebo SR.",
            "Zabezpečuje, aby osoby oprávnené spracúvať osobné údaje (zamestnanci, subdodávatelia) boli viazané povinnosťou mlčanlivosti alebo primeranou zákonnou povinnosťou mlčanlivosti.",
            "Prijíma primerané technické a organizačné opatrenia podľa čl. 32 GDPR — viď časť 7.",
            "Pomáha prevádzkovateľovi pri vybavovaní žiadostí dotknutých osôb (prístup, oprava, vymazanie, prenosnosť) — prevádzkovateľ má k týmto funkciám priamy prístup cez platformu.",
            "Oznámi prevádzkovateľovi bez zbytočného odkladu (najneskôr do 48 hodín) akékoľvek porušenie ochrany osobných údajov, ktoré sa týka jeho dát.",
            "Po ukončení poskytovania služieb (30 dní po ukončení zmluvy) údaje trvalo vymaže alebo vráti — na voľbu prevádzkovateľa.",
          ],
        },
        {
          title: "5. Povinnosti prevádzkovateľa (zákazník)",
          content: [
            "Zabezpečuje platný právny základ (čl. 6 GDPR) na spracúvanie osobných údajov, ktoré vkladá do platformy.",
            "Informuje dotknuté osoby o spracúvaní vrátane toho, že ich údaje sú spracúvané prostredníctvom sprostredkovateľa Unifyo so sídlom v SR a infraštruktúrou v EÚ (Hetzner, Nemecko).",
            "Nevkladá osobné údaje nad rámec účelu svojho podnikania a nezneužíva AI funkcie platformy na profilovanie dotknutých osôb bez ich vedomia.",
            "Zodpovedá za správnosť a aktuálnosť údajov, ktoré do platformy vkladá.",
          ],
        },
        {
          title: "6. Ďalší sprostredkovatelia (sub-processors)",
          content: [
            "Prevádzkovateľ týmto udeľuje všeobecný súhlas s využívaním nižšie uvedených ďalších sprostredkovateľov. Unifyo informuje o akejkoľvek zmene v zozname prostredníctvom aktualizácie tohto dokumentu minimálne 30 dní vopred a prevádzkovateľ má v tejto lehote právo namietať, v takom prípade má právo zmluvu ukončiť bez sankcie.",
            "Hetzner Online GmbH (Nemecko) — hosting aplikácie a databázy, spracúva všetky údaje uložené v platforme. Dátové centrá: Nürnberg / Falkenstein (EÚ).",
            "WebSupport s. r. o. (SR) — odosielanie transakčných emailov (verifikácia, reset hesla, kontaktný formulár). Spracúva emailové adresy a obsah odosielaných správ.",
            "OpenAI, L.L.C. / OpenAI Ireland Ltd. (USA/Írsko) — zabezpečenie AI funkcionality. Spracúva obsah správ, ktoré prevádzkovateľ zadáva AI asistentovi. Prenos do USA je krytý Štandardnými zmluvnými doložkami (SCC) a účasťou OpenAI v EU-US Data Privacy Framework.",
            "Anthropic, PBC (USA) — alternatívny AI model (Claude). Spracúva to isté ako OpenAI, krytý SCC + DPF.",
            "Stripe Payments Europe, Ltd. (Írsko) — spracúvanie platieb (pri aktivácii plateného plánu). Spracúva platobné a fakturačné údaje.",
          ],
        },
        {
          title: "7. Bezpečnostné opatrenia (čl. 32 GDPR)",
          content: [
            "Šifrovanie: TLS 1.3 pre prenos dát, AES-256 pri ukladaní v Hetzner infraštruktúre, bcrypt pre hashovanie hesiel, SHA-256 pre hashovanie tokenov (žiadne tokeny v plaintexte v DB).",
            "Riadenie prístupov: prístup k produkčnej databáze majú výlučne autorizované osoby sprostredkovateľa cez SSH s 2FA, všetky prístupy sú logované.",
            "Zálohovanie: automatizovaný denný snapshot databázy s 14-dňovou retenciou, uložený na oddelenom úložisku.",
            "Monitoring: interný error monitoring s okamžitou notifikáciou, SLA monitoring dostupnosti, pravidelný audit log admin akcií.",
            "Segregácia: údaje jednotlivých prevádzkovateľov sú logicky oddelené na úrovni databázy (userId foreign key enforcement).",
            "Reakcia na incidenty: dokumentovaný plán reakcie s notifikáciou do 48 hodín od zistenia porušenia ochrany údajov.",
          ],
        },
        {
          title: "8. Prenos mimo EÚ / EHP",
          content: [
            "Primárne úložisko a spracúvanie prebieha v EÚ (SR, Nemecko).",
            "Jediný prenos mimo EÚ/EHP je pri využívaní AI funkcionality (OpenAI, Anthropic — USA). Tento prenos je zabezpečený Štandardnými zmluvnými doložkami (SCC) schválenými Komisiou a účasťou poskytovateľov v EU-US Data Privacy Framework.",
            "Prevádzkovateľ môže v nastaveniach účtu zakázať využívanie AI funkcií, čím úplne eliminuje prenos mimo EÚ.",
          ],
        },
        {
          title: "9. Audity a kontroly",
          content: [
            "Unifyo sprístupní prevádzkovateľovi na vyžiadanie všetky informácie potrebné na preukázanie plnenia povinností podľa čl. 28 GDPR.",
            "Prevádzkovateľ má právo raz ročne vykonať audit (na vlastné náklady) — vzdialene prostredníctvom dotazníka alebo videokonferencie. Fyzický audit na mieste je možný iba po predchádzajúcom písomnom dohovore.",
          ],
        },
        {
          title: "10. Zodpovednosť a záverečné ustanovenia",
          content: [
            "Zodpovednosť za škodu spôsobenú porušením GDPR sa riadi čl. 82 GDPR a všeobecnými právnymi predpismi SR.",
            "Táto DPA má prednosť pred VOP v otázkach spracúvania osobných údajov.",
            "Zmeny DPA oznámi Unifyo prevádzkovateľovi minimálne 30 dní vopred prostredníctvom emailu a aktualizáciou dátumu na tejto stránke.",
            "Pre uzavretie individuálnej písomnej DPA (napr. pre enterprise klientov s osobitnými požiadavkami compliance) kontaktujte info@unifyo.online.",
          ],
        },
      ]}
    />
  );
}
